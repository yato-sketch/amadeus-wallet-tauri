import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

// Components
import OnboardingCheck from "@/components/OnboardingCheck";

// Contexts
import { useWallet } from "@/contexts/WalletContext";

// Lib
import { hasWallet } from "@/lib/wallet";
import { globals } from "@/lib/globals";

type WalletLocationState = { publicKeyBase58: string; privateKeyBase58?: string | null } | null;

export default function ProtectedRoute({
    children,
    disableOnboarding = false,
}: {
    children: React.ReactNode;
    disableOnboarding?: boolean;
}) {
    const location = useLocation();
    const { wallet, setWallet } = useWallet();
    const [hasWalletFile, setHasWalletFile] = useState<boolean | null>(null);
    const timedOut = useRef(false);
    const state = location.state as WalletLocationState;

    const hydratedFromState = useRef(false);
    useEffect(() => {
        if (state?.publicKeyBase58 && !hydratedFromState.current) {
            hydratedFromState.current = true;
            setWallet(state.publicKeyBase58, state.privateKeyBase58 ?? null);
        }
    }, [state?.publicKeyBase58, state?.privateKeyBase58, setWallet]);

    const hasAccess = !!wallet.publicKeyBase58 || !!state?.publicKeyBase58;
    if (hasAccess) {
        if (disableOnboarding) return <>{children}</>;
        return <OnboardingCheck>{children}</OnboardingCheck>;
    }

    useEffect(() => {
        let cancelled = false;
        timedOut.current = false;
        const inTauri = "__TAURI__" in window;
        if (!inTauri) {
            setHasWalletFile(false);
            return;
        }
        const timeout = setTimeout(() => {
            if (!cancelled) {
                timedOut.current = true;
                setHasWalletFile(false);
            }
        }, globals.WALLET_CHECK_TIMEOUT_MS);
        hasWallet()
            .then((v) => {
                if (!cancelled && !timedOut.current) setHasWalletFile(v);
            })
            .catch(() => {
                if (!cancelled) setHasWalletFile(false);
            })
            .finally(() => clearTimeout(timeout));
        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, []);

    if (hasWalletFile === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <span className="text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (!hasWalletFile) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Navigate to="/auth/login" replace />;
}