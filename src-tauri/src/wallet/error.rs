use thiserror::Error;

#[derive(Error, Debug)]
pub enum WalletError {
    #[error("Crypto error: {0}")]
    Crypto(String),

    #[error("Storage error: {0}")]
    Storage(String),

    #[error("Invalid private key: {0}")]
    InvalidPrivateKey(String),

    #[error("Decryption failed (wrong password?)")]
    DecryptionFailed,

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}
