import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { CopyIcon } from "lucide-react";
import { truncateAddress } from "@/lib/transactions";
import { copyToClipboard } from "@/lib/utils";
import type { UnifiedTx } from "@/lib/transactionDisplay";
import { COPY_RESET_MS, formatTxDate, formatTxStatus } from "@/lib/transactionDisplay";

type Props = {
    tx: UnifiedTx;
    onSelect: (tx: UnifiedTx) => void;
};

export function TransactionRow({ tx, onSelect }: Props) {
    const [copied, setCopied] = useState(false);
    const copyHash = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!tx.txHash) return;
            copyToClipboard(tx.txHash, "Tx hash", () => {
                setCopied(true);
                setTimeout(() => setCopied(false), COPY_RESET_MS);
            });
        },
        [tx.txHash]
    );

    const isSent = tx.kind === "sent";
    const dateDisplay = formatTxDate(tx.timestampMs);
    const blockDisplay =
        tx.blockHeight != null ? `Block #${tx.blockHeight.toLocaleString()}` : "—";
    const statusDisplay = formatTxStatus(tx.status);

    return (
        <TableRow
            role="button"
            tabIndex={0}
            onClick={() => onSelect(tx)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(tx)}
            className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
        >
            <TableCell className="text-muted-foreground text-sm tabular-nums">
                {dateDisplay}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm tabular-nums">
                {blockDisplay}
            </TableCell>
            <TableCell>
                <Badge variant={isSent ? "secondary" : "default"} className="text-xs">
                    {isSent ? "Sent" : "Received"}
                </Badge>
            </TableCell>
            <TableCell>
                <Badge variant={statusDisplay.variant} className="text-xs">
                    {statusDisplay.label}
                </Badge>
            </TableCell>
            <TableCell className="font-medium tabular-nums">
                {isSent ? "−" : "+"}
                {tx.amountDisplay} AMA
            </TableCell>
            <TableCell className="text-muted-foreground text-sm truncate max-w-[120px] sm:max-w-[180px]" title={tx.counterparty}>
                {isSent ? "To" : "From"} {truncateAddress(tx.counterparty)}
            </TableCell>
            <TableCell className="w-9">
                {tx.txHash ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={copyHash}
                        title="Copy tx hash"
                    >
                        {copied ? (
                            <span className="text-xs">✓</span>
                        ) : (
                            <CopyIcon className="h-3.5 w-3.5" />
                        )}
                    </Button>
                ) : null}
            </TableCell>
        </TableRow>
    );
}
