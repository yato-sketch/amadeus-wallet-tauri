const STORAGE_KEY = "amadeus-wallet-sent-txs";
const MAX_ENTRIES = 100;

export type SentTxEntry = {
  senderPublicKey: string;
  txHash: string;
  recipient: string;
  amount: string;
  memo?: string;
  timestamp: number;
};

function loadAll(): SentTxEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is SentTxEntry =>
        x != null &&
        typeof x === "object" &&
        typeof (x as SentTxEntry).senderPublicKey === "string" &&
        typeof (x as SentTxEntry).txHash === "string" &&
        typeof (x as SentTxEntry).recipient === "string" &&
        typeof (x as SentTxEntry).amount === "string" &&
        typeof (x as SentTxEntry).timestamp === "number"
    );
  } catch {
    return [];
  }
}

function saveAll(entries: SentTxEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // ignore
  }
}

export function getSentTransactions(senderPublicKey: string): SentTxEntry[] {
  const all = loadAll();
  return all
    .filter((e) => e.senderPublicKey === senderPublicKey)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function addSentTransaction(entry: SentTxEntry): void {
  const all = loadAll();
  all.push(entry);
  saveAll(all);
}

export function clearAllSentTransactions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function truncateAddress(addr: string, head = 8, tail = 4): string {
  if (!addr || addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
