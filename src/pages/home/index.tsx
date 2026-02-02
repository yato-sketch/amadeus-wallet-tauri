import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { KeyRoundIcon } from "lucide-react";
import { getWalletFilePath } from "@/lib/wallet";

type WalletState = { publicKeyBase58: string; privateKeyBase58?: string | null };

export default function HomePage() {
    const location = useLocation();
    const { wallet } = useWallet();
    const state = location.state as WalletState | null;
    const publicKeyBase58 = wallet.publicKeyBase58 ?? state?.publicKeyBase58 ?? null;
    const privateKeyBase58 = wallet.privateKeyBase58 ?? state?.privateKeyBase58 ?? null;
    const [walletFilePath, setWalletFilePath] = useState<string | null>(null);

    useEffect(() => {
        getWalletFilePath()
            .then(setWalletFilePath)
            .catch(() => {});
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRoundIcon className="h-5 w-5" />
                        Wallet
                    </CardTitle>
                    <CardDescription>
                        Your public key (address) and private key (Base58, 64 bytes).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Public key (address)
                        </h3>
                        {publicKeyBase58 != null ? (
                            <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm break-all select-all">
                                {publicKeyBase58}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No address loaded. Unlock your wallet from the login page.
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Private key (Base58, 64 bytes)
                        </h3>
                        {privateKeyBase58 != null ? (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    Only visible right after create or import. Do not share.
                                </p>
                                <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm break-all select-all">
                                    {privateKeyBase58}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Only shown right after you create or import a wallet. After refresh or login, the private key address is not displayed for security.
                            </p>
                        )}
                    </div>
                    {walletFilePath && (
                        <div className="space-y-2 border-t pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Wallet file location
                            </h3>
                            <p className="font-mono text-xs text-muted-foreground break-all">
                                {walletFilePath}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
