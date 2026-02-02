import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Contexts
import { useWallet } from "@/contexts/WalletContext";

// Shadcn UI
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCardIcon, RefreshCwIcon, WalletIcon } from "lucide-react";
import { TransactionDetailSheet, TransactionList } from "@/components/transactions";

// Lib
import { mergeTransactions } from "@/lib/transactionDisplay";
import { getSentTransactions } from "@/lib/transactions";
import { getTransactions, type TransactionItem } from "@/lib/wallet";


export default function TransactionsPage() {
    const { wallet } = useWallet();
    const publicKeyBase58 = wallet.publicKeyBase58;

    const [apiTransactions, setApiTransactions] = useState<TransactionItem[]>([]);
    const [nextSentCursor, setNextSentCursor] = useState<string | null>(null);
    const [nextReceivedCursor, setNextReceivedCursor] = useState<string | null>(null);
    const [apiLoading, setApiLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [selectedTx, setSelectedTx] = useState<ReturnType<typeof mergeTransactions>[number] | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const loadMoreSentinelRef = useRef<HTMLTableRowElement | null>(null);

    const fetchFromApi = useCallback(() => {
        if (!publicKeyBase58) {
            setApiLoading(false);
            return;
        }
        setApiLoading(true);
        setApiError(null);
        setNextSentCursor(null);
        setNextReceivedCursor(null);
        getTransactions(publicKeyBase58)
            .then((res) => {
                setApiTransactions(res.ok ? res.transactions : []);
                setNextSentCursor(res.next_sent_cursor ?? null);
                setNextReceivedCursor(res.next_received_cursor ?? null);
                setApiError(res.ok ? null : res.error ?? "Could not load transactions");
            })
            .catch(() => {
                setApiTransactions([]);
                setApiError("Failed to fetch transactions");
            })
            .finally(() => setApiLoading(false));
    }, [publicKeyBase58]);

    const loadMore = useCallback(() => {
        if (!publicKeyBase58 || loadingMore) return;
        const hasMore = nextSentCursor != null || nextReceivedCursor != null;
        if (!hasMore) return;
        setLoadingMore(true);
        getTransactions(publicKeyBase58, nextSentCursor, nextReceivedCursor)
            .then((res) => {
                if (res.ok && res.transactions.length > 0) {
                    setApiTransactions((prev) => {
                        const byHash = new Map(
                            prev.map((t) => [t.tx_hash ?? `i-${prev.indexOf(t)}`, t])
                        );
                        res.transactions.forEach((t) => {
                            const k = t.tx_hash ?? `new-${t.block_height ?? 0}`;
                            if (!byHash.has(k)) byHash.set(k, t);
                        });
                        return Array.from(byHash.values()).sort(
                            (a, b) => (b.block_height ?? 0) - (a.block_height ?? 0)
                        );
                    });
                }
                setNextSentCursor(res.next_sent_cursor ?? null);
                setNextReceivedCursor(res.next_received_cursor ?? null);
            })
            .finally(() => setLoadingMore(false));
    }, [publicKeyBase58, nextSentCursor, nextReceivedCursor, loadingMore]);

    useEffect(() => {
        fetchFromApi();
    }, [fetchFromApi]);

    useEffect(() => {
        const el = loadMoreSentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMore();
            },
            { rootMargin: "200px", threshold: 0 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [loadMore, nextSentCursor, nextReceivedCursor]);

    const localSent = useMemo(() => {
        if (!publicKeyBase58) return [];
        return getSentTransactions(publicKeyBase58);
    }, [publicKeyBase58]);

    const merged = useMemo(() => {
        if (!publicKeyBase58) return [];
        return mergeTransactions(apiTransactions, localSent, publicKeyBase58);
    }, [publicKeyBase58, apiTransactions, localSent]);

    const hasMore = nextSentCursor != null || nextReceivedCursor != null;

    const handleSelectTx = useCallback((tx: ReturnType<typeof mergeTransactions>[number]) => {
        setSelectedTx(tx);
        setDetailOpen(true);
    }, []);

    if (publicKeyBase58 == null) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5" />
                            Transactions
                        </CardTitle>
                        <CardDescription>
                            Transaction history for your wallet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Unlock your wallet to see sent and received transactions.
                        </p>
                        <Button asChild variant="default">
                            <Link to="/wallet/receive">
                                <WalletIcon className="h-4 w-4 mr-2" />
                                Open Wallet
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full">
            <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5" />
                            Transactions
                        </CardTitle>
                        <CardDescription>
                            Sent and received AMA. History from the node is merged with your local
                            sent list.
                        </CardDescription>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchFromApi}
                        disabled={apiLoading}
                        title="Refresh from node"
                        className="shrink-0"
                    >
                        <RefreshCwIcon className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <TransactionList
                        transactions={merged}
                        apiLoading={apiLoading}
                        apiError={apiError}
                        loadingMore={loadingMore}
                        hasMore={hasMore}
                        loadMoreSentinelRef={loadMoreSentinelRef}
                        onRefresh={fetchFromApi}
                        onSelectTx={handleSelectTx}
                    />
                </CardContent>
            </Card>

            <TransactionDetailSheet
                tx={selectedTx}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />
        </div>
    );
}
