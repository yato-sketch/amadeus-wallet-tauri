import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";

export type WalletState = {
    publicKeyBase58: string | null;
    privateKeyBase58: string | null;
};

type WalletContextValue = {
    wallet: WalletState;
    setWallet: (publicKeyBase58: string, privateKeyBase58?: string | null) => void;
    setPublicKeyOnly: (publicKeyBase58: string) => void;
    clearWallet: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [wallet, setWalletState] = useState<WalletState>(() => ({
        publicKeyBase58: null,
        privateKeyBase58: null,
    }));

    const setWallet = useCallback((publicKeyBase58: string, privateKeyBase58?: string | null) => {
        setWalletState({
            publicKeyBase58,
            privateKeyBase58: privateKeyBase58 ?? null,
        });
    }, []);

    const setPublicKeyOnly = useCallback((publicKeyBase58: string) => {
        setWalletState({ publicKeyBase58, privateKeyBase58: null });
    }, []);

    const clearWallet = useCallback(() => {
        setWalletState({ publicKeyBase58: null, privateKeyBase58: null });
    }, []);

    return (
        <WalletContext.Provider
            value={{ wallet, setWallet, setPublicKeyOnly, clearWallet }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) {
        throw new Error("useWallet must be used within WalletProvider");
    }
    return ctx;
}
