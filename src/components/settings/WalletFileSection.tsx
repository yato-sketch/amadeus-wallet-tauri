import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletIcon, CopyIcon, Loader2Icon } from "lucide-react";

type Props = {
    loading: boolean;
    walletPath: string | null;
    onCopy: (text: string, label: string) => void;
};

export function WalletFileSection({ loading, walletPath, onCopy }: Props) {
    return (
        <section id="wallet" className="scroll-mt-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <WalletIcon className="h-5 w-5" />
                        Wallet file
                    </CardTitle>
                    <CardDescription>
                        Where your encrypted wallet is stored. Back it up to recover your keys.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                            Loading…
                        </p>
                    ) : walletPath ? (
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={walletPath}
                                className="font-mono text-sm flex-1 bg-muted/50"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                title="Copy path"
                                onClick={() => onCopy(walletPath, "Path")}
                            >
                                <CopyIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No wallet yet. Create or import one from Home.
                        </p>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
