use crate::wallet::error::WalletError;
use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit};
use argon2::Argon2;
use rand::RngCore;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use std::path::Path;

const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;
const TAG_LEN: usize = 16;

pub fn encrypt_and_store(
    private_key_base58: &str,
    password: &str,
    path: &Path,
) -> Result<(), WalletError> {
    let mut salt = [0u8; SALT_LEN];
    rand::rng().fill_bytes(&mut salt);
    let key = derive_key(password, &salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| WalletError::Crypto(e.to_string()))?;
    let mut nonce = [0u8; NONCE_LEN];
    rand::rng().fill_bytes(&mut nonce);
    let plaintext = private_key_base58.as_bytes();
    let ciphertext = cipher
        .encrypt((&nonce).into(), plaintext)
        .map_err(|_| WalletError::Crypto("Encryption failed".into()))?;
    let mut out = salt.to_vec();
    out.extend_from_slice(&nonce);
    out.extend_from_slice(&ciphertext);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| WalletError::Storage(e.to_string()))?;
    }
    std::fs::write(path, BASE64.encode(&out)).map_err(|e| WalletError::Storage(e.to_string()))?;
    Ok(())
}

pub fn load_and_decrypt(password: &str, path: &Path) -> Result<String, WalletError> {
    let data = std::fs::read(path).map_err(|e| WalletError::Storage(e.to_string()))?;
    let decoded = BASE64.decode(&data).map_err(|_| WalletError::DecryptionFailed)?;
    if decoded.len() < SALT_LEN + NONCE_LEN + TAG_LEN {
        return Err(WalletError::DecryptionFailed);
    }
    let (salt, rest) = decoded.split_at(SALT_LEN);
    let (nonce_bytes, ciphertext) = rest.split_at(NONCE_LEN);
    let key = derive_key(password, salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| WalletError::Crypto(e.to_string()))?;
    let nonce = aes_gcm::Nonce::from_slice(nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| WalletError::DecryptionFailed)?;
    String::from_utf8(plaintext).map_err(|_| WalletError::DecryptionFailed)
}

fn derive_key(password: &str, salt: &[u8]) -> Result<[u8; 32], WalletError> {
    let mut out = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut out)
        .map_err(|e| WalletError::Crypto(e.to_string()))?;
    Ok(out)
}
