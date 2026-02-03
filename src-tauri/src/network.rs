use serde_json::Value;

const REQUEST_TIMEOUT_SECS: u64 = 30;

#[derive(Debug, serde::Serialize)]
pub struct SubmitResult {
    pub ok: bool,
    pub tx_hash: Option<String>,
    pub error: Option<String>,
    pub network_error: bool,
}

pub async fn submit_transaction_to_api(api_url: &str, signed_tx_base58: &str) -> Result<SubmitResult, String> {
    let base = api_url.trim_end_matches('/');
    let url = format!("{}/api/tx/submit", base);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .build()
        .map_err(|e| e.to_string())?;

    let res = match client
        .post(&url)
        .header("Content-Type", "text/plain")
        .body(signed_tx_base58.to_string())
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            let msg = e.to_string();
            return Ok(SubmitResult {
                ok: false,
                tx_hash: None,
                error: Some(msg),
                network_error: true,
            });
        }
    };

    let status = res.status();
    let text = res.text().await.map_err(|e| e.to_string())?;

    let ok = status.is_success();
    let mut tx_hash: Option<String> = None;
    let mut error: Option<String> = None;

    if !text.is_empty() {
        if let Ok(data) = serde_json::from_str::<Value>(&text) {
            tx_hash = data
                .get("txHash")
                .or_else(|| data.get("tx_hash"))
                .or_else(|| data.get("hash"))
                .or_else(|| data.get("id"))
                .and_then(|v| v.as_str())
                .map(String::from);
            if !ok {
                error = data
                    .get("error")
                    .or_else(|| data.get("message"))
                    .or_else(|| data.get("detail"))
                    .and_then(|v| v.as_str())
                    .map(String::from);
            }
        }
    }
    if error.is_none() && !ok {
        let status_code = status.as_u16();
        let hint = match status_code {
            520 => " (Cloudflare: origin server error — node may be down or overloaded)",
            521 => " (Cloudflare: origin server refused connection)",
            522 => " (Cloudflare: connection timed out)",
            523 => " (Cloudflare: origin unreachable)",
            524 => " (Cloudflare: timeout)",
            502 | 503 | 504 => " (server temporarily unavailable — try again later)",
            _ if (500..600).contains(&status_code) => " (server error — try again later)",
            _ => "",
        };
        error = Some(if text.trim().is_empty() {
            format!("HTTP {}{}", status_code, hint)
        } else {
            format!("HTTP {}: {}{}", status_code, text.trim(), hint)
        });
    }

    Ok(SubmitResult {
        ok,
        tx_hash,
        error,
        network_error: false,
    })
}

#[derive(Debug, serde::Serialize)]
pub struct BalanceResult {
    pub ok: bool,
    pub balance_flat: Option<String>,
    pub error: Option<String>,
    pub network_error: bool,
}

fn balance_value_to_string(v: &Value) -> Option<String> {
    v.as_str()
        .map(String::from)
        .or_else(|| v.as_u64().map(|n| n.to_string()))
        .or_else(|| v.as_i64().map(|n| n.to_string()))
        .or_else(|| v.as_f64().map(|n| n.trunc() as u64).map(|n| n.to_string()))
}

fn parse_balance_from_json(data: &Value) -> Option<String> {
    data.get("balance")
        .and_then(|b| {
            b.get("flat")
                .or_else(|| b.get("balance_flat"))
                .and_then(balance_value_to_string)
                .or_else(|| balance_value_to_string(b))
        })
        .or_else(|| {
            data.get("balance_flat")
                .or_else(|| data.get("balance_ama"))
                .or_else(|| data.get("amount"))
                .or_else(|| data.get("balance_flat_units"))
                .and_then(balance_value_to_string)
        })
        .or_else(|| {
            data.get("data")
                .and_then(|d| parse_balance_from_json(d))
        })
        .or_else(|| {
            data.get("result")
                .and_then(|r| parse_balance_from_json(r))
        })
}

pub async fn get_balance_from_api(api_url: &str, address_base58: &str) -> Result<BalanceResult, String> {
    let base = api_url.trim_end_matches('/');
    let addr = address_base58.trim();
    let url = format!("{}/api/wallet/balance/{}", base, addr);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .build()
        .map_err(|e| e.to_string())?;

    let res = match client.get(&url).send().await {
        Ok(r) => r,
        Err(e) => {
            let msg = e.to_string();
            let network_error = msg.contains("connection") || msg.contains("dns") || msg.contains("timed out");
            return Ok(BalanceResult {
                ok: false,
                balance_flat: None,
                error: Some(msg),
                network_error,
            });
        }
    };

    let status = res.status();
    let code = status.as_u16();
    let text = res.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        let err_msg = if text.trim().is_empty() {
            format!("HTTP {}", code)
        } else {
            format!("HTTP {}: {}", code, text.trim())
        };
        return Ok(BalanceResult {
            ok: false,
            balance_flat: None,
            error: Some(err_msg),
            network_error: false,
        });
    }

    if let Ok(data) = serde_json::from_str::<Value>(&text) {
        if let Some(balance_flat) = parse_balance_from_json(&data) {
            return Ok(BalanceResult {
                ok: true,
                balance_flat: Some(balance_flat),
                error: None,
                network_error: false,
            });
        }
    }

    Ok(BalanceResult {
        ok: false,
        balance_flat: None,
        error: Some("Response has no balance field".to_string()),
        network_error: false,
    })
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct TransactionItem {
    pub tx_hash: Option<String>,
    pub kind: String,
    pub from_address: Option<String>,
    pub to_address: Option<String>,
    pub amount_flat: String,
    pub block_height: Option<u64>,
    pub status: Option<String>,
    pub memo: Option<String>,
    pub exec_used: Option<String>,
    pub timestamp_ms: Option<u64>,
}

#[derive(Debug, serde::Serialize)]
pub struct TransactionsResult {
    pub ok: bool,
    pub transactions: Vec<TransactionItem>,
    pub next_sent_cursor: Option<String>,
    pub next_received_cursor: Option<String>,
    pub error: Option<String>,
    pub network_error: bool,
}

#[derive(Debug, serde::Serialize)]
pub struct TransactionStatusResult {
    pub ok: bool,
    pub status: Option<String>,
    pub error: Option<String>,
    pub network_error: bool,
}

fn str_from_value(v: &Value) -> Option<String> {
    v.as_str().map(String::from)
}

fn amount_flat_from_value(v: &Value) -> Option<String> {
    v.as_str()
        .map(String::from)
        .or_else(|| v.as_u64().map(|n| n.to_string()))
        .or_else(|| v.as_i64().map(|n| n.to_string()))
        .or_else(|| {
            v.as_f64().map(|f| {
                let flat = (f * 1_000_000_000.0).round() as i64;
                flat.to_string()
            })
        })
}

fn action_args_get(item: &Value, idx: usize) -> Option<&Value> {
    item.get("tx")
        .and_then(|t| t.get("action"))
        .and_then(|a| a.get("args"))
        .and_then(|a| a.as_array())
        .and_then(|arr| arr.get(idx))
}

fn nonce_to_timestamp_ms(value: &Value) -> Option<u64> {
    let n = value.as_u64().or_else(|| value.as_i64().map(|i| i as u64))?;
    let ms = if n >= 1_000_000_000_000_000 {
        n / 1_000_000
    } else if n >= 1_000_000_000_000 {
        n / 1_000
    } else if n >= 1_000_000_000 {
        n
    } else {
        return None;
    };
    const MS_2000: u64 = 946_684_800_000;
    const MS_2100: u64 = 4_102_444_800_000;
    if ms >= MS_2000 && ms <= MS_2100 {
        Some(ms)
    } else {
        None
    }
}

/// Status from API: receipt.success (bool), receipt.result / result.error (string), metadata.status ("finalized").
fn parse_status_from_tx_value(item: &Value) -> Option<String> {
    if let Some(receipt) = item.get("receipt") {
        if let Some(ok) = receipt.get("success").and_then(|v| v.as_bool()) {
            if ok {
                return Some("ok".to_string());
            }
            if let Some(r) = receipt.get("result").and_then(str_from_value).filter(|s| !s.is_empty() && !s.eq_ignore_ascii_case("ok")) {
                return Some(r);
            }
        }
        if let Some(r) = receipt.get("result").and_then(str_from_value).filter(|s| !s.is_empty()) {
            return Some(if r.eq_ignore_ascii_case("ok") { "ok".to_string() } else { r });
        }
    }
    if let Some(err) = item.get("result").and_then(|r| r.get("error")).and_then(str_from_value).filter(|s| !s.is_empty()) {
        return Some(if err.eq_ignore_ascii_case("ok") { "ok".to_string() } else { err });
    }
    item.get("metadata")
        .and_then(|m| m.get("status"))
        .and_then(str_from_value)
        .filter(|s| !s.is_empty())
}

/// Parse one tx from API shape: hash, metadata.entry_height, receipt.*, result.error, tx.{signer,action.args,nonce}.
fn parse_tx_item(item: &Value, my_address: &str) -> Option<TransactionItem> {
    let tx_hash = item.get("hash").or_else(|| item.get("tx_hash")).and_then(str_from_value);
    let from = item.get("tx").and_then(|t| t.get("signer")).or_else(|| item.get("signer")).and_then(str_from_value);
    let to = action_args_get(item, 0)
        .and_then(str_from_value)
        .or_else(|| item.get("to_address").and_then(str_from_value));
    let amount_flat = action_args_get(item, 1)
        .and_then(amount_flat_from_value)
        .or_else(|| item.get("amount").and_then(amount_flat_from_value))
        .unwrap_or_else(|| "0".to_string());
    let block_height = item
        .get("metadata")
        .and_then(|m| m.get("entry_height"))
        .and_then(|v| v.as_u64().or_else(|| v.as_i64().map(|n| n as u64)));
    let status = parse_status_from_tx_value(item);
    let memo = item.get("memo").or_else(|| item.get("message")).and_then(str_from_value);
    let exec_used = item
        .get("receipt")
        .and_then(|r| r.get("exec_used"))
        .and_then(amount_flat_from_value)
        .filter(|s| !s.is_empty());
    let timestamp_ms = item
        .get("tx")
        .and_then(|t| t.get("nonce"))
        .and_then(nonce_to_timestamp_ms)
        .or_else(|| item.get("nonce").and_then(nonce_to_timestamp_ms));
    let kind = if from.as_deref() == Some(my_address) {
        "sent"
    } else if to.as_deref() == Some(my_address) {
        "received"
    } else {
        "unknown"
    };
    Some(TransactionItem {
        tx_hash,
        kind: kind.to_string(),
        from_address: from,
        to_address: to,
        amount_flat,
        block_height,
        status,
        memo,
        exec_used,
        timestamp_ms,
    })
}

fn cursor_from_value(data: &Value) -> Option<String> {
    data.get("cursor")
        .or_else(|| data.get("next_cursor"))
        .or_else(|| data.get("nextCursor"))
        .and_then(str_from_value)
        .filter(|s| !s.is_empty())
}

fn parse_tx_list(data: &Value, my_address: &str) -> Vec<TransactionItem> {
    let arr = data
        .get("txs")
        .and_then(Value::as_array)
        .or_else(|| data.get("transactions").and_then(Value::as_array));
    let Some(arr) = arr else {
        return vec![];
    };
    let mut out: Vec<TransactionItem> = arr
        .iter()
        .filter_map(|v| parse_tx_item(v, my_address))
        .collect();
    out.sort_by(|a, b| {
        let ha = a.block_height.unwrap_or(0);
        let hb = b.block_height.unwrap_or(0);
        hb.cmp(&ha)
    });
    out
}

async fn fetch_tx_list(
    client: &reqwest::Client,
    url: &str,
) -> Result<(reqwest::StatusCode, String), String> {
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    let status = res.status();
    let text = res.text().await.map_err(|e| e.to_string())?;
    Ok((status, text))
}

fn build_tx_filter_url(base: &str, signer: bool, addr: &str, cursor: Option<&str>) -> String {
    let (param, value) = if signer {
        ("signer", addr)
    } else {
        ("arg0", addr)
    };
    let mut url = format!(
        "{}/api/chain/tx_by_filter?{}={}&limit=50&sort=desc",
        base, param, value
    );
    if let Some(c) = cursor {
        if !c.is_empty() {
            url.push_str("&cursor=");
            url.push_str(c);
        }
    }
    url
}

pub async fn get_transactions_from_api(
    api_url: &str,
    address_base58: &str,
    sent_cursor: Option<&str>,
    received_cursor: Option<&str>,
) -> Result<TransactionsResult, String> {
    let base = api_url.trim_end_matches('/');
    let addr = address_base58.trim();

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .build()
        .map_err(|e| e.to_string())?;

    let url_sent = build_tx_filter_url(base, true, addr, sent_cursor);
    let url_received = build_tx_filter_url(base, false, addr, received_cursor);

    let (sent_status, sent_text) = match fetch_tx_list(&client, &url_sent).await {
        Ok(s) => s,
        Err(e) => {
            let network_error = e.contains("connection") || e.contains("dns") || e.contains("timed out");
            return Ok(TransactionsResult {
                ok: false,
                transactions: vec![],
                next_sent_cursor: None,
                next_received_cursor: None,
                error: Some(e),
                network_error,
            });
        }
    };

    if !sent_status.is_success() {
        let code = sent_status.as_u16();
        let err_msg = if code == 404 {
            "Transaction history not supported by this node".to_string()
        } else if sent_text.trim().is_empty() {
            format!("HTTP {}", code)
        } else {
            format!("HTTP {}: {}", code, sent_text.trim())
        };
        return Ok(TransactionsResult {
            ok: false,
            transactions: vec![],
            next_sent_cursor: None,
            next_received_cursor: None,
            error: Some(err_msg),
            network_error: false,
        });
    }

    let (mut transactions, next_sent_cursor) = if let Ok(data) = serde_json::from_str::<Value>(&sent_text) {
        let list = parse_tx_list(&data, addr);
        let next = cursor_from_value(&data);
        (list, next)
    } else {
        (vec![], None)
    };

    let (received, next_received_cursor) = match fetch_tx_list(&client, &url_received).await {
        Ok((status, text)) if status.is_success() => {
            if let Ok(data) = serde_json::from_str::<Value>(&text) {
                let list = parse_tx_list(&data, addr);
                let next = cursor_from_value(&data);
                (list, next)
            } else {
                (vec![], None)
            }
        }
        _ => (vec![], None),
    };

    for tx in received {
        transactions.push(tx);
    }

    let received_hashes: std::collections::HashSet<_> = transactions
        .iter()
        .filter(|t| t.kind == "received")
        .filter_map(|t| t.tx_hash.as_ref())
        .collect();
    let mut extra: Vec<TransactionItem> = Vec::new();
    for tx in &transactions {
        if tx.kind != "sent" {
            continue;
        }
        let is_self = tx.to_address.as_deref() == Some(addr);
        if !is_self {
            continue;
        }
        let Some(ref h) = tx.tx_hash else {
            continue;
        };
        if received_hashes.contains(h) {
            continue;
        }
        let mut recv = tx.clone();
        recv.kind = "received".to_string();
        recv.from_address = tx.to_address.clone();
        recv.to_address = tx.from_address.clone();
        extra.push(recv);
    }
    transactions.extend(extra);
    transactions.sort_by(|a, b| {
        let ha = a.block_height.unwrap_or(0);
        let hb = b.block_height.unwrap_or(0);
        match hb.cmp(&ha) {
            std::cmp::Ordering::Equal => {
                match (a.kind.as_str(), b.kind.as_str()) {
                    ("received", "sent") => std::cmp::Ordering::Less,
                    ("sent", "received") => std::cmp::Ordering::Greater,
                    _ => std::cmp::Ordering::Equal,
                }
            }
            o => o,
        }
    });

    Ok(TransactionsResult {
        ok: true,
        transactions,
        next_sent_cursor,
        next_received_cursor,
        error: None,
        network_error: false,
    })
}

pub async fn get_transaction_status_from_api(
    api_url: &str,
    tx_hash: &str,
) -> Result<TransactionStatusResult, String> {
    let base = api_url.trim_end_matches('/');
    let hash = tx_hash.trim();
    if hash.is_empty() {
        return Ok(TransactionStatusResult {
            ok: false,
            status: None,
            error: Some("Empty transaction hash".to_string()),
            network_error: false,
        });
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .build()
        .map_err(|e| e.to_string())?;

    let urls_to_try = [
        format!("{}/api/chain/tx/{}", base, hash),
        format!("{}/api/tx/{}", base, hash),
        format!("{}/api/chain/tx?hash={}", base, hash),
    ];

    for url in &urls_to_try {
        let res = match client.get(url).send().await {
            Ok(r) => r,
            Err(e) => {
                let msg = e.to_string();
                let network_error = msg.contains("connection") || msg.contains("dns") || msg.contains("timed out");
                return Ok(TransactionStatusResult {
                    ok: false,
                    status: None,
                    error: Some(msg),
                    network_error,
                });
            }
        };

        let status = res.status();
        let code = status.as_u16();
        let text = res.text().await.map_err(|e| e.to_string())?;

        if !status.is_success() {
            if code == 404 {
                continue; // try next URL
            }
            return Ok(TransactionStatusResult {
                ok: false,
                status: None,
                error: Some(if text.trim().is_empty() {
                    format!("HTTP {}", code)
                } else {
                    format!("HTTP {}: {}", code, text.trim())
                }),
                network_error: false,
            });
        }

        if text.trim().is_empty() {
            continue;
        }

        let data: Value = match serde_json::from_str(&text) {
            Ok(d) => d,
            Err(_) => continue,
        };

        // Response may be: single object, or { txs: [one] }, or { data: [one] }, or { result: {...} }
        let item = data
            .get("txs")
            .and_then(|a| a.as_array())
            .and_then(|a| a.first())
            .or_else(|| data.get("data").and_then(|a| a.as_array()).and_then(|a| a.first()))
            .or_else(|| data.get("transactions").and_then(|a| a.as_array()).and_then(|a| a.first()))
            .unwrap_or(&data);

        if let Some(status) = parse_status_from_tx_value(item) {
            return Ok(TransactionStatusResult {
                ok: true,
                status: Some(status),
                error: None,
                network_error: false,
            });
        }
    }

    Ok(TransactionStatusResult {
        ok: false,
        status: None,
        error: Some("Transaction not found or status not available".to_string()),
        network_error: false,
    })
}

#[derive(Debug, serde::Serialize)]
pub struct HealthCheckResult {
    pub ok: bool,
    pub status_code: Option<u16>,
    pub message: String,
}

pub async fn check_node_health(api_url: &str) -> HealthCheckResult {
    let base = api_url.trim_end_matches('/');
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return HealthCheckResult {
                ok: false,
                status_code: None,
                message: format!("Failed to create HTTP client: {}", e),
            };
        }
    };

    let urls_to_try: &[(String, &str)] = &[
        (format!("{}/api/chain/stats", base), "chain/stats"),
        (format!("{}/api/", base), "api/"),
        (base.to_string(), "base"),
    ];

    for (i, (url, label)) in urls_to_try.iter().enumerate() {
        match client.get(url).send().await {
            Ok(res) => {
                let status = res.status();
                let code = status.as_u16();
                if status.is_success() {
                    return HealthCheckResult {
                        ok: true,
                        status_code: Some(code),
                        message: format!("OK (HTTP {}, {})", code, label),
                    };
                }
                if code == 404 || code == 405 {
                    continue;
                }
                return HealthCheckResult {
                    ok: false,
                    status_code: Some(code),
                    message: format!(
                        "HTTP {} — {}",
                        code,
                        if code == 520 {
                            "Cloudflare: origin server error (node may be down)"
                        } else if (500..600).contains(&code) {
                            "server error"
                        } else {
                            "unexpected response"
                        }
                    ),
                };
            }
            Err(e) => {
                if i == urls_to_try.len() - 1 {
                    return HealthCheckResult {
                        ok: false,
                        status_code: None,
                        message: e.to_string(),
                    };
                }
            }
        }
    }

    HealthCheckResult {
        ok: false,
        status_code: None,
        message: "No successful response from node".to_string(),
    }
}
