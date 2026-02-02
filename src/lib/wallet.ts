import { invoke } from "@tauri-apps/api/core";
import { globals } from "@/lib/globals";

const STORAGE_API_URL_KEY = "amadeus-api-url";

export function getAmadeusApiUrl(): string {
  const stored = localStorage.getItem(STORAGE_API_URL_KEY);
  if (stored?.trim()) return stored.trim().replace(/\/$/, "");
  return globals.AMADEUS_NODE_API_URL;
}

/** Saves a custom API URL (empty string clears override and uses default). */
export function setAmadeusApiUrl(url: string): void {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed) localStorage.setItem(STORAGE_API_URL_KEY, trimmed);
  else localStorage.removeItem(STORAGE_API_URL_KEY);
}

export type HealthCheckResult = {
  ok: boolean;
  status_code?: number;
  message: string;
};

export async function checkNodeHealth(apiUrl: string): Promise<HealthCheckResult> {
  return invoke<HealthCheckResult>("check_node_health", {
    apiUrl: apiUrl.trim().replace(/\/$/, "") || getAmadeusApiUrl(),
  });
}

const BALANCE_DECIMALS = 9;

export type BalanceResult = {
  ok: boolean;
  balance_flat?: string;
  error?: string;
  network_error?: boolean;
};

export async function getBalance(addressBase58: string): Promise<BalanceResult> {
  return invoke<BalanceResult>("get_balance", {
    apiUrl: getAmadeusApiUrl(),
    addressBase58: addressBase58.trim(),
  });
}

/** Formats flat balance (9 decimals) for display: e.g. "5000000000" -> "5.000000000" */
export function formatBalance(balanceFlat: string | undefined): string {
  if (balanceFlat == null || balanceFlat === "") return "0";
  try {
    const flat = BigInt(balanceFlat);
    if (flat < 0n) return "0";
    const div = BigInt(10 ** BALANCE_DECIMALS);
    const intPart = flat / div;
    const fracPart = flat % div;
    const fracStr = fracPart.toString().padStart(BALANCE_DECIMALS, "0").replace(/0+$/, "") || "0";
    return fracStr === "0" ? intPart.toString() : `${intPart}.${fracStr}`;
  } catch {
    return "0";
  }
}

export async function createWallet(password: string): Promise<string> {
  return invoke<string>("wallet_create", { password });
}

export async function importWallet(
  privateKeyBase58: string,
  password: string
): Promise<void> {
  return invoke("wallet_import", {
    privateKeyBase58,
    password,
  });
}

export async function unlockWallet(password: string): Promise<string> {
  return invoke<string>("wallet_unlock", { password });
}

export async function hasWallet(): Promise<boolean> {
  return invoke<boolean>("wallet_has", {});
}

export async function getPublicKeyFromPrivate(privateKeyBase58: string): Promise<string> {
  return invoke<string>("wallet_public_key_from_private", {
    privateKeyBase58,
  });
}

export async function getWalletFilePath(): Promise<string> {
  return invoke<string>("wallet_file_path", {});
}

export async function changeWalletPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  return invoke("wallet_change_password", {
    args: {
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim(),
    },
  });
}

export async function validateAddress(addressBase58: string): Promise<boolean> {
  return invoke<boolean>("wallet_validate_address", {
    addressBase58: addressBase58.trim(),
  });
}

/** Signs a transfer and returns JSON payload for the node API. */
export async function signTransaction(
  password: string,
  recipientBase58: string,
  amount: string,
  memo: string
): Promise<string> {
  return invoke<string>("wallet_sign_transaction", {
    password,
    recipientBase58: recipientBase58.trim(),
    amount: amount.trim(),
    memo: (memo ?? "").trim(),
  });
}

export type SubmitTransactionResult = {
  ok: boolean;
  txHash?: string;
  error?: string;
  networkError?: boolean;
};

export async function submitTransaction(signedTxJson: string): Promise<SubmitTransactionResult> {
  type BackendResult = { ok: boolean; tx_hash?: string; error?: string; network_error: boolean };
  const r = await invoke<BackendResult>("submit_transaction_to_network", {
    apiUrl: getAmadeusApiUrl(),
    signedTxJson,
  });
  return {
    ok: r.ok,
    txHash: r.tx_hash,
    error: r.error,
    networkError: r.network_error,
  };
}

export type TransactionItem = {
  tx_hash?: string;
  kind: string;
  from_address?: string;
  to_address?: string;
  amount_flat: string;
  block_height?: number;
  status?: string;
  memo?: string;
  /** Gas fee (execution units used), e.g. receipt.exec_used */
  exec_used?: string;
  /** Timestamp in ms (derived from tx.nonce when nonce is time-based) */
  timestamp_ms?: number;
};

export type TransactionsResult = {
  ok: boolean;
  transactions: TransactionItem[];
  next_sent_cursor?: string | null;
  next_received_cursor?: string | null;
  error?: string;
  network_error?: boolean;
};

export async function getTransactions(
  addressBase58: string,
  sentCursor?: string | null,
  receivedCursor?: string | null
): Promise<TransactionsResult> {
  type BackendResult = {
    ok: boolean;
    transactions: TransactionItem[];
    next_sent_cursor?: string | null;
    next_received_cursor?: string | null;
    error?: string;
    network_error: boolean;
  };
  const r = await invoke<BackendResult>("get_transactions", {
    apiUrl: getAmadeusApiUrl(),
    addressBase58: addressBase58.trim(),
    sentCursor: sentCursor ?? null,
    receivedCursor: receivedCursor ?? null,
  });
  return {
    ok: r.ok,
    transactions: r.transactions ?? [],
    next_sent_cursor: r.next_sent_cursor ?? null,
    next_received_cursor: r.next_received_cursor ?? null,
    error: r.error,
    network_error: r.network_error,
  };
}

export type TransactionStatusResult = {
  ok: boolean;
  status?: string | null;
  error?: string | null;
  network_error?: boolean;
};

/** Fetches a single transaction's status by hash from the node API. */
export async function getTransactionStatus(txHash: string): Promise<TransactionStatusResult> {
  type BackendResult = {
    ok: boolean;
    status?: string | null;
    error?: string | null;
    network_error?: boolean;
  };
  const r = await invoke<BackendResult>("get_transaction_status", {
    apiUrl: getAmadeusApiUrl(),
    txHash: txHash.trim(),
  });
  return {
    ok: r.ok,
    status: r.status ?? null,
    error: r.error ?? null,
    network_error: r.network_error ?? false,
  };
}
