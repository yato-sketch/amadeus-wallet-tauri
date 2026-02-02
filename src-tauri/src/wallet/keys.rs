use crate::wallet::error::WalletError;
use bls12_381::Scalar;
use blst::min_pk::SecretKey as BlsSecretKey;
use group::Curve;
use rand::RngCore;
use bs58;

const PRIVATE_KEY_LEN: usize = 64;
const PUBLIC_KEY_LEN: usize = 48;

pub fn generate_private_key_base58() -> Result<String, WalletError> {
    let mut sk_64 = [0u8; PRIVATE_KEY_LEN];
    loop {
        rand::rng().fill_bytes(&mut sk_64);
        let scalar = Scalar::from_bytes_wide(&sk_64);
        let mut sk_be = scalar.to_bytes();
        sk_be.reverse();
        if BlsSecretKey::from_bytes(&sk_be).is_ok() {
            return Ok(bs58::encode(sk_64).into_string());
        }
    }
}

pub fn public_key_from_private_base58(private_key_base58: &str) -> Result<String, WalletError> {
    use bls12_381::G1Projective;
    let sk_bytes = decode_private_key_base58(private_key_base58)?;
    let sk_scalar = Scalar::from_bytes_wide(&sk_bytes);
    let pk_g1 = G1Projective::generator() * sk_scalar;
    let pk_bytes = pk_g1.to_affine().to_compressed();
    Ok(bs58::encode(pk_bytes).into_string())
}

pub fn parse_private_key_base58(base58_str: &str) -> Result<String, WalletError> {
    let decoded = decode_private_key_base58(base58_str)?;
    Ok(bs58::encode(decoded).into_string())
}

pub fn validate_public_key_base58(s: &str) -> Result<bool, WalletError> {
    let decoded = bs58::decode(s.trim())
        .into_vec()
        .map_err(|e| WalletError::InvalidPrivateKey(e.to_string()))?;
    Ok(decoded.len() == PUBLIC_KEY_LEN)
}

pub fn public_key_bytes_from_private_base58(private_key_base58: &str) -> Result<[u8; PUBLIC_KEY_LEN], WalletError> {
    use bls12_381::G1Projective;
    let sk_bytes = decode_private_key_base58(private_key_base58)?;
    let sk_scalar = Scalar::from_bytes_wide(&sk_bytes);
    let pk_g1 = G1Projective::generator() * sk_scalar;
    let pk_bytes = pk_g1.to_affine().to_compressed();
    Ok(pk_bytes)
}

pub fn sign_hash_with_dst(sk_bytes: &[u8; PRIVATE_KEY_LEN], hash: &[u8; 32], dst: &[u8]) -> Result<[u8; 96], WalletError> {
    let sk_scalar = Scalar::from_bytes_wide(sk_bytes);
    let mut sk_be = sk_scalar.to_bytes();
    sk_be.reverse();
    let sk = BlsSecretKey::from_bytes(&sk_be).map_err(|e| WalletError::Crypto(format!("{:?}", e)))?;
    let sig = sk.sign(hash, dst, &[]);
    Ok(sig.to_bytes())
}

pub fn decode_private_key_base58(s: &str) -> Result<[u8; PRIVATE_KEY_LEN], WalletError> {
    let decoded = bs58::decode(s.trim())
        .into_vec()
        .map_err(|e| WalletError::InvalidPrivateKey(e.to_string()))?;
    if decoded.len() != PRIVATE_KEY_LEN {
        return Err(WalletError::InvalidPrivateKey(format!(
            "Private key must be {} bytes (Base58 decoded), got {}",
            PRIVATE_KEY_LEN,
            decoded.len()
        )));
    }
    let mut arr = [0u8; PRIVATE_KEY_LEN];
    arr.copy_from_slice(&decoded);
    let scalar = Scalar::from_bytes_wide(&arr);
    let mut sk_be = scalar.to_bytes();
    sk_be.reverse();
    BlsSecretKey::from_bytes(&sk_be).map_err(|_| WalletError::InvalidPrivateKey("Invalid secret key".into()))?;
    Ok(arr)
}
