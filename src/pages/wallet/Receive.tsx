import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import QRCode from "qrcode";

// Contexts
import { useWallet } from "@/contexts/WalletContext";

// Components
import { useRefetchBalance } from "@/components/layout";

// Shadcn UI
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowDownIcon, CopyIcon } from "lucide-react";

// Lib
import { receiveRequestSchema, type ReceiveRequestForm } from "@/lib/schemas";
import { AMADEUS_URI_PREFIX } from "@/lib/constants";
import { copyToClipboard } from "@/lib/utils";

export default function WalletReceivePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { wallet } = useWallet();
    const refetchBalance = useRefetchBalance();
    const state = location.state as { publicKeyBase58?: string } | null;
    const publicKeyBase58 = wallet.publicKeyBase58 ?? state?.publicKeyBase58 ?? null;

    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [requestUri, setRequestUri] = useState<string | null>(null);

    const {
        watch,
        handleSubmit,
        register,
        formState: { errors },
    } = useForm<ReceiveRequestForm>({
        resolver: zodResolver(receiveRequestSchema),
        defaultValues: { amount: "", memo: "" },
        mode: "onChange",
    });

    const amount = watch("amount");
    const memo = watch("memo");

    useEffect(() => {
        refetchBalance();
    }, [refetchBalance]);

    useEffect(() => {
        if (!publicKeyBase58) return;
        const payload = requestUri ?? publicKeyBase58;
        QRCode.toDataURL(payload, { width: 256, margin: 2 })
            .then(setQrDataUrl)
            .catch(() => setQrDataUrl(null));
    }, [publicKeyBase58, requestUri]);

    useEffect(() => {
        if (!publicKeyBase58) return;
        const hasParams = (amount?.trim() || memo?.trim());
        if (hasParams) {
            const params = new URLSearchParams();
            if (amount?.trim()) params.set("amount", amount.trim());
            if (memo?.trim()) params.set("memo", memo.trim());
            setRequestUri(`${AMADEUS_URI_PREFIX}${publicKeyBase58}?${params.toString()}`);
        } else {
            setRequestUri(null);
        }
    }, [publicKeyBase58, amount, memo]);

    const copyAddress = useCallback(() => {
        if (!publicKeyBase58) return;
        copyToClipboard(publicKeyBase58, "Address");
    }, [publicKeyBase58]);

    const copyRequestUri = useCallback(() => {
        const text = requestUri ?? publicKeyBase58 ?? "";
        if (!text) return;
        copyToClipboard(text, "Request link");
    }, [requestUri, publicKeyBase58]);

    const onRequestSubmit = (data: ReceiveRequestForm) => {
        const params = new URLSearchParams();
        if (data.amount?.trim()) params.set("amount", data.amount.trim());
        if (data.memo?.trim()) params.set("memo", data.memo.trim());
        const uri = `${AMADEUS_URI_PREFIX}${publicKeyBase58}?${params.toString()}`;
        copyToClipboard(uri, "Request link");
        toast.success("Request link copied", { description: "Share this link so others can send you the specified amount." });
    };

    if (publicKeyBase58 == null) {
        navigate("/", { replace: true });
        return null;
    }

    return (
        <div className="space-y-6 max-w-lg">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowDownIcon className="h-5 w-5" />
                        Receive
                    </CardTitle>
                    <CardDescription>
                        Share your Amadeus address (Base58 public key) so others can send you funds.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {qrDataUrl && (
                        <div className="flex justify-center rounded-lg border bg-white p-4 dark:bg-muted/30">
                            <img src={qrDataUrl} alt="Address QR code" className="size-64 object-contain" />
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Your address</p>
                        <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm break-all select-all">
                            {publicKeyBase58}
                        </div>
                        <Button variant="outline" size="sm" onClick={copyAddress} className="w-full sm:w-auto">
                            <CopyIcon className="size-4" />
                            Copy address
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Request specific amount (optional)</CardTitle>
                    <CardDescription>
                        Add amount and memo to generate a request link. Senders can use this to pre-fill the transfer.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onRequestSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="receive-amount" className="text-sm font-medium">
                                Amount
                            </Label>
                            <Input
                                id="receive-amount"
                                placeholder="0"
                                {...register("amount")}
                            />
                            {errors.amount && (
                                <p className="text-xs text-destructive">{errors.amount.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="receive-memo" className="text-sm font-medium">
                                Memo
                            </Label>
                            <Input
                                id="receive-memo"
                                placeholder="e.g. Invoice #123"
                                maxLength={256}
                                {...register("memo")}
                            />
                            {errors.memo && (
                                <p className="text-xs text-destructive">{errors.memo.message}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 sm:flex-row justify-end mt-4">
                        <Button type="submit" variant="secondary">
                            Copy request link
                        </Button>
                        {(amount?.trim() || memo?.trim()) && (
                            <Button type="button" variant="outline" onClick={copyRequestUri}>
                                <CopyIcon className="size-4" />
                                Copy QR payload
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
