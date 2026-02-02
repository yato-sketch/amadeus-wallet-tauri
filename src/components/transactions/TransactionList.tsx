import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpRightIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import type { UnifiedTx } from "@/lib/transactionDisplay";
import { TransactionRow } from "./TransactionRow";

type Props = {
    transactions: UnifiedTx[];
    apiLoading: boolean;
    apiError: string | null;
    loadingMore: boolean;
    hasMore: boolean;
    loadMoreSentinelRef: React.RefObject<HTMLTableRowElement | null>;
    onRefresh: () => void;
    onSelectTx: (tx: UnifiedTx) => void;
};

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <ArrowUpRightIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No transactions yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
                Send AMA from the Wallet to see history here.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/wallet/send">Send AMA</Link>
            </Button>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="rounded-md border border-border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Block</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                        <TableHead className="text-muted-foreground text-xs">Amount</TableHead>
                        <TableHead className="text-muted-foreground text-xs">To / From</TableHead>
                        <TableHead className="w-9" scope="col" aria-hidden />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3].map((i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="w-9" />
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export function TransactionList({
    transactions,
    apiLoading,
    apiError,
    loadingMore,
    hasMore,
    loadMoreSentinelRef,
    onRefresh,
    onSelectTx,
}: Props) {
    if (apiLoading && transactions.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Loading transaction history…
                </div>
                <LoadingSkeleton />
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="space-y-4">
                {apiError ? (
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                        {apiError}
                    </div>
                ) : null}
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {apiError ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-sm text-muted-foreground">{apiError}</p>
                    <Button variant="ghost" size="sm" onClick={onRefresh} title="Retry">
                        <RefreshCwIcon className="h-4 w-4" />
                    </Button>
                </div>
            ) : null}
            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Block</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                            <TableHead className="text-muted-foreground text-xs">Amount</TableHead>
                            <TableHead className="text-muted-foreground text-xs">To / From</TableHead>
                            <TableHead className="w-9" scope="col" aria-hidden />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((tx, i) => (
                            <TransactionRow
                                key={tx.txHash ?? `tx-${tx.blockHeight ?? i}-${i}`}
                                tx={tx}
                                onSelect={onSelectTx}
                            />
                        ))}
                        {hasMore ? (
                            <TableRow ref={loadMoreSentinelRef} aria-hidden>
                                <TableCell colSpan={7} className="py-4 text-center text-muted-foreground text-xs">
                                    {loadingMore ? (
                                        <span className="inline-flex items-center gap-1">
                                            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                                            Loading more…
                                        </span>
                                    ) : (
                                        <span className="opacity-0">Load more</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
