import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { CopyIcon, Loader2Icon } from "lucide-react";
import { getTransactionStatus } from "@/lib/wallet";
import { copyToClipboard } from "@/lib/utils";
import type { UnifiedTx } from "@/lib/transactionDisplay";
import { COPY_RESET_MS, formatTxDate, formatTxStatus } from "@/lib/transactionDisplay";

type Props = {
    tx: UnifiedTx | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function DetailRow({
    label,
    value,
    copyValue,
    onCopy,
    copiedField,
}: {
    label: string;
    value: string;
    copyValue?: string;
    onCopy: (text: string, field: string) => void;
    copiedField: string | null;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-sm font-mono break-all">{value || "—"}</span>
                {copyValue != null && copyValue !== "" && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 shrink-0 p-0"
                        onClick={() => onCopy(copyValue, label)}
                        title={`Copy ${label}`}
                    >
                        {copiedField === label ? (
                            <span className="text-xs">Copied</span>
                        ) : (
                            <CopyIcon className="h-3.5 w-3.5" />
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

export function TransactionDetailSheet({ tx, open, onOpenChange }: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [fetchedStatus, setFetchedStatus] = useState<string | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    useEffect(() => {
        if (!open || !tx?.txHash) {
            setFetchedStatus(null);
            setStatusLoading(false);
            return;
        }
        if (tx.status != null && tx.status !== "") {
            setFetchedStatus(null);
            setStatusLoading(false);
            return;
        }
        setStatusLoading(true);
        setFetchedStatus(null);
        getTransactionStatus(tx.txHash)
            .then((r) => {
                setFetchedStatus(r.status ?? r.error ?? "Unknown");
            })
            .catch(() => setFetchedStatus("Could not fetch status"))
            .finally(() => setStatusLoading(false));
    }, [open, tx?.txHash, tx?.status]);

    const copy = (text: string, field: string) => {
        copyToClipboard(text, field, () => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), COPY_RESET_MS);
        });
    };

    if (!tx) return null;

    const isSent = tx.kind === "sent";
    const blockDisplay =
        tx.blockHeight != null ? `Block #${tx.blockHeight.toLocaleString()}` : "—";
    const statusDisplay = tx.status ?? fetchedStatus ?? (statusLoading ? "Checking…" : "—");
    const statusBadge = formatTxStatus(statusDisplay);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Transaction details</SheetTitle>
                    <SheetDescription>
                        {isSent ? "Sent" : "Received"} {tx.amountDisplay} AMA
                    </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 p-4 pt-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">Status</span>
                        <div className="flex items-center gap-2">
                            {statusLoading ? (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                                    Checking status…
                                </span>
                            ) : (
                                <Badge variant={statusBadge.variant} className="w-fit text-xs">
                                    {statusBadge.label}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <DetailRow
                        label="Type"
                        value={isSent ? "Sent" : "Received"}
                        onCopy={copy}
                        copiedField={copiedField}
                    />
                    <DetailRow
                        label="Amount"
                        value={`${isSent ? "−" : "+"}${tx.amountDisplay} AMA`}
                        onCopy={copy}
                        copiedField={copiedField}
                    />
                    <DetailRow
                        label={isSent ? "To" : "From"}
                        value={tx.counterparty}
                        copyValue={tx.counterparty}
                        onCopy={copy}
                        copiedField={copiedField}
                    />
                    <DetailRow
                        label="Transaction hash"
                        value={tx.txHash ?? "—"}
                        copyValue={tx.txHash ?? undefined}
                        onCopy={copy}
                        copiedField={copiedField}
                    />
                    <DetailRow
                        label="Block"
                        value={blockDisplay}
                        onCopy={copy}
                        copiedField={copiedField}
                    />
                    {tx.timestampMs != null && tx.timestampMs > 0 && (
                        <DetailRow
                            label="Date"
                            value={formatTxDate(tx.timestampMs)}
                            onCopy={copy}
                            copiedField={copiedField}
                        />
                    )}
                    {tx.execUsedDisplay != null && tx.execUsedDisplay !== "" && (
                        <DetailRow
                            label="Gas fee"
                            value={`${tx.execUsedDisplay} AMA`}
                            onCopy={copy}
                            copiedField={copiedField}
                        />
                    )}
                    {tx.memo != null && tx.memo !== "" && (
                        <DetailRow
                            label="Memo"
                            value={tx.memo}
                            onCopy={copy}
                            copiedField={copiedField}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
