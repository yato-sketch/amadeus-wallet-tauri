mod amadeus_tx;
mod network;
mod wallet;

#[derive(serde::Deserialize)]
struct ChangePasswordArgs {
    #[serde(rename = "currentPassword")]
    current_password: String,
    #[serde(rename = "newPassword")]
    new_password: String,
}

#[tauri::command]
fn wallet_create(app: tauri::AppHandle, password: String) -> Result<String, String> {
    wallet::create_wallet(&app, &password).map_err(|e| e.to_string())
}

#[tauri::command]
fn wallet_import(
    app: tauri::AppHandle,
    private_key_base58: String,
    password: String,
) -> Result<(), String> {
    wallet::import_wallet(&app, &private_key_base58, &password).map_err(|e| e.to_string())
}

#[tauri::command]
fn wallet_unlock(app: tauri::AppHandle, password: String) -> Result<String, String> {
    wallet::unlock_wallet(&app, &password).map_err(|e| e.to_string())
}

#[tauri::command]
fn wallet_has(app: tauri::AppHandle) -> Result<bool, String> {
    wallet::has_wallet(&app).map_err(|e| e.to_string())
}

#[tauri::command]
fn wallet_public_key_from_private(private_key_base58: String) -> Result<String, String> {
    wallet::public_key_from_private_base58(&private_key_base58).map_err(|e| e.to_string())
}

#[tauri::command]
fn wallet_file_path(app: tauri::AppHandle) -> Result<String, String> {
    wallet::wallet_file_path(&app)
        .map(|p| p.display().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn wallet_validate_address(address_base58: String) -> Result<bool, String> {
    wallet::validate_public_key_base58(&address_base58).map_err(|e| e.to_string())
}

#[tauri::command]
fn wallet_change_password(app: tauri::AppHandle, args: ChangePasswordArgs) -> Result<(), String> {
    wallet::change_password(&app, &args.current_password, &args.new_password)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn wallet_sign_transaction(
    app: tauri::AppHandle,
    password: String,
    recipient_base58: String,
    amount: String,
    memo: String,
) -> Result<String, String> {
    wallet::sign_transaction(
        &app,
        &password,
        &recipient_base58,
        &amount,
        &memo,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn submit_transaction_to_network(api_url: String, signed_tx_json: String) -> Result<network::SubmitResult, String> {
    network::submit_transaction_to_api(&api_url, &signed_tx_json)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn check_node_health(api_url: String) -> Result<network::HealthCheckResult, String> {
    Ok(network::check_node_health(&api_url).await)
}

#[tauri::command]
async fn get_balance(api_url: String, address_base58: String) -> Result<network::BalanceResult, String> {
    network::get_balance_from_api(&api_url, &address_base58)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_transactions(
    api_url: String,
    address_base58: String,
    sent_cursor: Option<String>,
    received_cursor: Option<String>,
) -> Result<network::TransactionsResult, String> {
    network::get_transactions_from_api(
        &api_url,
        &address_base58,
        sent_cursor.as_deref(),
        received_cursor.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_transaction_status(api_url: String, tx_hash: String) -> Result<network::TransactionStatusResult, String> {
    network::get_transaction_status_from_api(&api_url, &tx_hash)
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            wallet_create,
            wallet_import,
            wallet_unlock,
            wallet_has,
            wallet_public_key_from_private,
            wallet_file_path,
            wallet_validate_address,
            wallet_change_password,
            wallet_sign_transaction,
            submit_transaction_to_network,
            check_node_health,
            get_balance,
            get_transactions,
            get_transaction_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
