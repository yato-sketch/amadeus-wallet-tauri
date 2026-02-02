import { useState, useCallback, useEffect } from "react";

// Components
import { WalletFileSection } from "@/components/settings/WalletFileSection";

// Lib
import { getWalletFilePath, hasWallet } from "@/lib/wallet";
import { copyToClipboard } from "@/lib/utils";

export default function WalletPage() {
    const [walletPath, setWalletPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const loadWalletInfo = useCallback(async () => {
        setLoading(true);
        try {
            const [path] = await Promise.all([getWalletFilePath(), hasWallet()]);
            setWalletPath(path ?? null);
        } catch {
            setWalletPath(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWalletInfo();
    }, [loadWalletInfo]);

    return (
        <div className="max-w-2xl mx-auto">
            <WalletFileSection
                loading={loading}
                walletPath={walletPath}
                onCopy={copyToClipboard}
            />
        </div>
    );
}
