use crate::wallet::{keys, WalletError};
use sha2::{Digest, Sha256};

const DECIMALS: u32 = 9;

fn amount_to_flat_units(amount: &str) -> Result<String, WalletError> {
    let amount = amount.trim();
    if amount.is_empty() {
        return Err(WalletError::Crypto("Amount cannot be empty".into()));
    }
    let value: f64 = amount.parse().map_err(|_| {
        WalletError::Crypto(format!("Invalid amount: {}", amount))
    })?;
    if value < 0.0 || !value.is_finite() {
        return Err(WalletError::Crypto("Amount must be a non-negative number".into()));
    }
    let flat = (value * 10f64.powi(DECIMALS as i32)).round();
    if flat < 0.0 || flat > u64::MAX as f64 {
        return Err(WalletError::Crypto("Amount too large".into()));
    }
    Ok((flat as u64).to_string())
}

const DST_TX: &[u8] = b"AMADEUS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_TX_";

fn vecpak_varint(buf: &mut Vec<u8>, v: i128) {
    if v == 0 {
        buf.push(0);
        return;
    }
    let sign = (v < 0) as u8;
    let mag = v.unsigned_abs();
    let lz = mag.leading_zeros() as usize;
    let first = lz / 8;
    let len = 16 - first;
    buf.push((sign << 7) | (len as u8));
    let be = mag.to_be_bytes();
    buf.extend_from_slice(&be[first..]);
}

fn vecpak_binary(buf: &mut Vec<u8>, data: &[u8]) {
    buf.push(5);
    vecpak_varint(buf, data.len() as i128);
    buf.extend_from_slice(data);
}

fn vecpak_int(buf: &mut Vec<u8>, n: i128) {
    buf.push(3);
    vecpak_varint(buf, n);
}

fn vecpak_list(buf: &mut Vec<u8>, items: &[Vec<u8>]) {
    buf.push(6);
    vecpak_varint(buf, items.len() as i128);
    for item in items {
        buf.extend_from_slice(item);
    }
}

fn vecpak_proplist(buf: &mut Vec<u8>, mut pairs: Vec<(Vec<u8>, Vec<u8>)>) {
    pairs.sort_by(|a, b| a.0.cmp(&b.0));
    buf.push(7);
    vecpak_varint(buf, pairs.len() as i128);
    for (k, v) in pairs {
        buf.extend_from_slice(&k);
        buf.extend_from_slice(&v);
    }
}

fn encode_tx_action(
    contract: &[u8],
    function: &[u8],
    args: &[Vec<u8>],
    attached_symbol: Option<&[u8]>,
    attached_amount: Option<&[u8]>,
) -> Vec<u8> {
    let args_ser: Vec<Vec<u8>> = args.iter().map(|a| encode_binary(a)).collect();
    let mut list_buf = Vec::new();
    vecpak_list(&mut list_buf, &args_ser);

    let mut pairs: Vec<(Vec<u8>, Vec<u8>)> = vec![
        (encode_binary(b"args"), list_buf),
        (encode_binary(b"contract"), encode_binary(contract)),
        (encode_binary(b"function"), encode_binary(function)),
        (encode_binary(b"op"), encode_binary(b"call")),
    ];
    if let (Some(s), Some(a)) = (attached_symbol, attached_amount) {
        pairs.push((encode_binary(b"attached_amount"), encode_binary(a)));
        pairs.push((encode_binary(b"attached_symbol"), encode_binary(s)));
    }
    let mut out = Vec::new();
    vecpak_proplist(&mut out, pairs);
    out
}

fn encode_binary(data: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    vecpak_binary(&mut out, data);
    out
}

pub fn build_coin_transfer(
    private_key_base58: &str,
    recipient_base58: &str,
    amount: &str,
    symbol: &str,
) -> Result<Vec<u8>, WalletError> {
    let sk_bytes = keys::decode_private_key_base58(private_key_base58)?;
    let sender_pk = keys::public_key_bytes_from_private_base58(private_key_base58)?;
    let recipient_bytes = bs58::decode(recipient_base58.trim())
        .into_vec()
        .map_err(|e| WalletError::InvalidPrivateKey(e.to_string()))?;
    if recipient_bytes.len() != 48 {
        return Err(WalletError::InvalidPrivateKey(format!(
            "Recipient must be 48 bytes (Base58), got {}",
            recipient_bytes.len()
        )));
    }

    let amount_flat = amount_to_flat_units(amount)?;
    let symbol = if symbol.is_empty() { "AMA" } else { symbol };
    let args: Vec<Vec<u8>> = vec![
        recipient_bytes,
        amount_flat.as_bytes().to_vec(),
        symbol.as_bytes().to_vec(),
    ];

    let nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos() as i128)
        .unwrap_or(0);

    let action_ser = encode_tx_action(b"Coin", b"transfer", &args, None, None);
    let signer_ser = encode_binary(&sender_pk);

    let mut tx_pairs: Vec<(Vec<u8>, Vec<u8>)> = vec![
        (encode_binary(b"action"), action_ser),
        (encode_binary(b"nonce"), {
            let mut b = Vec::new();
            vecpak_int(&mut b, nonce);
            b
        }),
        (encode_binary(b"signer"), signer_ser),
    ];
    tx_pairs.sort_by(|a, b| a.0.cmp(&b.0));

    let mut tx_ser = Vec::new();
    vecpak_proplist(&mut tx_ser, tx_pairs);

    let hash: [u8; 32] = Sha256::digest(&tx_ser).into();
    let signature = keys::sign_hash_with_dst(&sk_bytes, &hash, DST_TX)?;

    let mut txu_pairs: Vec<(Vec<u8>, Vec<u8>)> = vec![
        (encode_binary(b"hash"), encode_binary(&hash)),
        (encode_binary(b"signature"), encode_binary(&signature)),
        (encode_binary(b"tx"), tx_ser),
    ];
    txu_pairs.sort_by(|a, b| a.0.cmp(&b.0));

    let mut out = Vec::new();
    vecpak_proplist(&mut out, txu_pairs);
    Ok(out)
}
