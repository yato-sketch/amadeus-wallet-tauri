use crate::wallet::error::WalletError;
use crate::wallet::keys;
use crate::wallet::storage;
use bs58;
use std::path::PathBuf;
use tauri::Manager;

const WALLET_FILENAME: &str = "wallet.enc";

pub fn wallet_dir(app_handle: &tauri::AppHandle) -> Result<PathBuf, WalletError> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| WalletError::Storage(e.to_string()))?;
    Ok(dir.join("wallet"))
}

fn wallet_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, WalletError> {
    Ok(wallet_dir(app_handle)?.join(WALLET_FILENAME))
}

pub fn create_wallet(app_handle: &tauri::AppHandle, password: &str) -> Result<String, WalletError> {
    let private_key_base58 = keys::generate_private_key_base58()?;
    let path = wallet_path(app_handle)?;
    storage::encrypt_and_store(&private_key_base58, password, &path)?;
    Ok(private_key_base58)
}

pub fn import_wallet(
    app_handle: &tauri::AppHandle,
    private_key_base58: &str,
    password: &str,
) -> Result<(), WalletError> {
    let normalized = keys::parse_private_key_base58(private_key_base58)?;
    let path = wallet_path(app_handle)?;
    storage::encrypt_and_store(&normalized, password, &path)?;
    Ok(())
}

pub fn unlock_wallet(app_handle: &tauri::AppHandle, password: &str) -> Result<String, WalletError> {
    let path = wallet_path(app_handle)?;
    if !path.exists() {
        return Err(WalletError::Storage("No wallet found. Create or import one first.".into()));
    }
    let private_key_base58 = storage::load_and_decrypt(password, &path)?;
    keys::public_key_from_private_base58(&private_key_base58)
}

pub fn has_wallet(app_handle: &tauri::AppHandle) -> Result<bool, WalletError> {
    Ok(wallet_path(app_handle)?.exists())
}

pub fn wallet_file_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, WalletError> {
    wallet_path(app_handle)
}

pub fn change_password(
    app_handle: &tauri::AppHandle,
    current_password: &str,
    new_password: &str,
) -> Result<(), WalletError> {
    let path = wallet_path(app_handle)?;
    if !path.exists() {
        return Err(WalletError::Storage("No wallet found.".into()));
    }
    let private_key_base58 = storage::load_and_decrypt(current_password, &path)?;
    storage::encrypt_and_store(&private_key_base58, new_password, &path)?;
    Ok(())
}

pub fn sign_transaction(
    app_handle: &tauri::AppHandle,
    password: &str,
    recipient_base58: &str,
    amount: &str,
    memo: &str,
) -> Result<String, WalletError> {
    let path = wallet_path(app_handle)?;
    if !path.exists() {
        return Err(WalletError::Storage("No wallet found.".into()));
    }
    let private_key_base58 = storage::load_and_decrypt(password, &path)?;
    let symbol = if memo.is_empty() { "AMA" } else { memo.trim() };
    let tx_packed = crate::amadeus_tx::build_coin_transfer(
        &private_key_base58,
        recipient_base58.trim(),
        amount.trim(),
        symbol,
    )?;
    Ok(bs58::encode(&tx_packed).into_string())
}
