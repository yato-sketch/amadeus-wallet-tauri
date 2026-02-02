import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2Icon, RefreshCwIcon, WalletIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { getBalance, formatBalance } from "@/lib/wallet";

const BALANCE_FETCH_TIMEOUT_MS = 20_000;

export const RefetchBalanceContext = createContext<(() => void) | null>(null);

export function useRefetchBalance(): () => void {
    const refetch = useContext(RefetchBalanceContext);
    return useCallback(() => refetch?.(), [refetch]);
}

export default function WalletLayout() {
    const { wallet } = useWallet();
    const [balanceFlat, setBalanceFlat] = useState<string | undefined>(undefined);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchBalance = useCallback(() => {
        if (!wallet.publicKeyBase58) {
            setBalanceFlat(undefined);
            setBalanceError(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setBalanceError(null);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            setLoading(false);
            setBalanceError((prev) => prev ?? "Request timed out");
        }, BALANCE_FETCH_TIMEOUT_MS);

        getBalance(wallet.publicKeyBase58)
            .then((res) => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                if (res.ok && res.balance_flat != null) {
                    setBalanceFlat(res.balance_flat);
                    setBalanceError(null);
                } else {
                    setBalanceFlat(undefined);
                    setBalanceError(res.error ?? "Could not load balance");
                }
            })
            .catch((err) => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                setBalanceFlat(undefined);
                setBalanceError("Failed to fetch balance");
                console.error("Balance fetch error:", err);
            })
            .finally(() => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                setLoading(false);
            });
    }, [wallet.publicKeyBase58]);

    useEffect(() => {
        fetchBalance();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [fetchBalance]);

    const hasAddress = !!wallet.publicKeyBase58;
    const displayBalance = balanceFlat != null ? formatBalance(balanceFlat) : "0";
    const showZeroFallback = hasAddress && !loading && (balanceError != null || balanceFlat == null);
    const isMobile = useIsMobile();

    return (
        <RefetchBalanceContext.Provider value={fetchBalance}>
            <div className={`flex gap-4 ${isMobile ? "flex-col" : "items-start"}`}>
                {isMobile ? (
                    <Card className="w-full shrink-0">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <WalletIcon className="h-5 w-5" />
                                Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {!hasAddress ? (
                                <p className="text-sm text-muted-foreground">Unlock your wallet to see balance.</p>
                            ) : loading ? (
                                <p className="flex items-center gap-2 text-lg font-semibold">
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                    Loading…
                                </p>
                            ) : (
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xl font-semibold tabular-nums">
                                        {displayBalance} <span className="text-sm font-normal text-muted-foreground">AMA</span>
                                    </p>
                                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={fetchBalance} disabled={loading} title="Refresh">
                                        <RefreshCwIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            {showZeroFallback && balanceError && (
                                <p className="mt-1 text-xs text-muted-foreground">{balanceError}</p>
                            )}
                        </CardContent>
                    </Card>
                ) : null}
                <Outlet />
                {!isMobile && (
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <WalletIcon className="h-5 w-5" />
                                Balance
                            </CardTitle>
                            <CardDescription>
                                Your wallet balance on the Amadeus network. Amounts use 9 decimal places (1 AMA = 10⁹ flat units).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!hasAddress ? (
                                <p className="text-sm text-muted-foreground">
                                    Unlock your wallet to see balance.
                                </p>
                            ) : loading ? (
                                <p className="flex items-center gap-2 text-lg font-semibold">
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                    Loading…
                                </p>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-2xl font-semibold tabular-nums">
                                            {displayBalance}{" "}
                                            <span className="text-base font-normal text-muted-foreground">
                                                AMA
                                            </span>
                                        </p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={fetchBalance}
                                            disabled={loading}
                                            title="Refresh balance"
                                        >
                                            <RefreshCwIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {showZeroFallback && balanceError && (
                                        <p className="text-xs text-muted-foreground">
                                            {balanceError}. Your node may not expose a balance API — showing 0. You can still send and receive. Try Settings → Network API URL or Refresh.
                                        </p>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </RefetchBalanceContext.Provider>
    );
}
