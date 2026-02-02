import { type SentTxEntry } from "@/lib/transactions";
import { formatBalance, type TransactionItem } from "@/lib/wallet";

export type UnifiedTx = {
    kind: "sent" | "received";
    txHash?: string;
    amountDisplay: string;
    counterparty: string;
    blockHeight?: number;
    status?: string;
    memo?: string;
    execUsedDisplay?: string;
    timestampMs?: number;
};

export const COPY_RESET_MS = 2000;

export function mergeTransactions(
    apiTxs: TransactionItem[],
    localSent: SentTxEntry[],
    _myAddress: string
): UnifiedTx[] {
    const byKey = new Map<string, UnifiedTx>();
    apiTxs.forEach((tx, i) => {
        const kind: "sent" | "received" = tx.kind === "received" ? "received" : "sent";
        const counterparty = kind === "sent" ? (tx.to_address ?? "") : (tx.from_address ?? "");
        const amountDisplay = formatBalance(tx.amount_flat);
        const execUsedDisplay = tx.exec_used ? formatBalance(tx.exec_used) : undefined;
        const entry: UnifiedTx = {
            kind,
            txHash: tx.tx_hash ?? undefined,
            amountDisplay,
            counterparty,
            blockHeight: tx.block_height,
            status: tx.status,
            memo: tx.memo,
            execUsedDisplay,
            timestampMs: tx.timestamp_ms,
        };
        const key = tx.tx_hash ?? `api-${i}`;
        byKey.set(key, entry);
    });
    localSent.forEach((tx) => {
        const key = tx.txHash || `local-${tx.timestamp}`;
        if (byKey.has(key)) return;
        byKey.set(key, {
            kind: "sent",
            txHash: tx.txHash || undefined,
            amountDisplay: tx.amount,
            counterparty: tx.recipient,
            blockHeight: undefined,
            status: undefined,
            memo: tx.memo,
            execUsedDisplay: undefined,
            timestampMs: tx.timestamp,
        });
    });
    const list = Array.from(byKey.values());
    list.sort((a, b) => (b.blockHeight ?? 0) - (a.blockHeight ?? 0));
    return list;
}

export function formatTxDate(timestampMs: number | undefined): string {
    if (timestampMs == null || timestampMs <= 0) return "—";
    try {
        const d = new Date(timestampMs);
        if (Number.isNaN(d.getTime())) return "—";
        return d.toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "short",
        });
    } catch {
        return "—";
    }
}

export type TxStatusDisplay = {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
};

export function formatTxStatus(raw: string | undefined): TxStatusDisplay {
    if (!raw || !raw.trim()) return { label: "—", variant: "outline" };
    const s = raw.trim().toLowerCase();
    if (s === "ok" || s === "success" || s === "included" || s === "confirmed" || s === "executed" || s === "committed" || s === "applied") {
        return { label: "OK", variant: "default" };
    }
    if (s === "insufficient_funds" || s === "insufficient funds") return { label: "Insufficient funds", variant: "destructive" };
    if (s.startsWith("failed: insufficient") || s.startsWith("failed:insufficient")) return { label: "Insufficient funds", variant: "destructive" };
    if (s.startsWith("failed") || s === "error" || s === "reverted") return { label: "Failed", variant: "destructive" };
    if (s === "finalized") return { label: "Finalized", variant: "default" };
    if (s === "pending" || s === "submitted") return { label: "Pending", variant: "secondary" };
    return { label: raw.length > 24 ? raw.slice(0, 24) + "…" : raw, variant: "outline" };
}
