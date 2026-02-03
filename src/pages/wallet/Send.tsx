import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Contexts
import { useWallet } from "@/contexts/WalletContext";
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
import { SendIcon, Loader2Icon, LinkIcon } from "lucide-react";

// Lib
import { sendTransferSchema, type SendTransferForm } from "@/lib/schemas";
import { getRecentAddresses, addRecentAddress } from "@/lib/recentAddresses";
import { parseRequestLink } from "@/lib/requestLink";
import { validateAddress, signTransaction, submitTransaction } from "@/lib/wallet";
import { addSentTransaction } from "@/lib/transactions";
import { getErrorMessage } from "@/lib/utils";

export default function WalletSendPage() {
    const navigate = useNavigate();
    const { wallet } = useWallet();
    const refetchBalance = useRefetchBalance();
    const publicKeyBase58 = wallet.publicKeyBase58;

    const [recentAddresses, setRecentAddresses] = useState<string[]>(() => getRecentAddresses());
    const [addressValidating, setAddressValidating] = useState(false);
    const [addressValid, setAddressValid] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        control,
        handleSubmit,
        watch,
        getValues,
        setValue,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<SendTransferForm & { password?: string }>({
        resolver: zodResolver(sendTransferSchema),
        defaultValues: {
            recipientAddress: "",
            amount: "",
            memo: "",
            password: "",
        },
        mode: "onChange",
    });

    const recipientAddress = watch("recipientAddress");

    useEffect(() => {
        setRecentAddresses(getRecentAddresses());
    }, []);

    const validateRecipient = useCallback(async (address: string) => {
        const trimmed = address.trim();
        if (!trimmed) {
            setAddressValid(null);
            return false;
        }
        setAddressValidating(true);
        setAddressValid(null);
        try {
            const ok = await validateAddress(trimmed);
            setAddressValid(ok);
            return ok;
        } catch {
            setAddressValid(false);
            return false;
        } finally {
            setAddressValidating(false);
        }
    }, []);

    useEffect(() => {
        if (!recipientAddress?.trim()) {
            setAddressValid(null);
            return;
        }
        const t = setTimeout(() => {
            validateRecipient(recipientAddress);
        }, 400);
        return () => clearTimeout(t);
    }, [recipientAddress, validateRecipient]);

    const onSelectRecent = (address: string) => {
        setValue("recipientAddress", address);
        clearErrors("recipientAddress");
    };

    const handlePasteRequestLink = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            const parsed = parseRequestLink(text);
            if (!parsed) {
                toast.error("Invalid request link", {
                    description: "Paste a link from the Receive page (e.g. amadeus:ADDRESS?amount=...&memo=...).",
                });
                return;
            }
            setValue("recipientAddress", parsed.address);
            if (parsed.amount != null) setValue("amount", parsed.amount);
            if (parsed.memo != null) setValue("memo", parsed.memo);
            clearErrors(["recipientAddress", "amount", "memo"]);
            setAddressValid(null);
            toast.success("Request link applied", {
                description: parsed.amount || parsed.memo
                    ? "Recipient, amount, and memo filled from the link."
                    : "Recipient address filled from the link.",
            });
        } catch {
            toast.error("Could not read clipboard", {
                description: "Allow clipboard access and try again.",
            });
        }
    }, [setValue, clearErrors]);

    const onSubmit = async (data: SendTransferForm & { password?: string }) => {
        const trimmed = data.recipientAddress.trim();
        const valid = await validateRecipient(trimmed);
        if (!valid) {
            setError("recipientAddress", { message: "Invalid Amadeus address (must be Base58, 48 bytes)." });
            toast.error("Invalid recipient address");
            return;
        }
        if (publicKeyBase58 == null) {
            toast.error("Wallet not loaded. Please log in again.");
            return;
        }
        const password = (getValues("password") ?? data.password ?? "").trim();
        if (!password) {
            toast.error("Enter your wallet password to sign the transaction.");
            setError("password", { message: "Password is required to sign." });
            return;
        }
        setIsSubmitting(true);
        try {
            addRecentAddress(trimmed);
            setRecentAddresses(getRecentAddresses());
            const signedTxJson = await signTransaction(
                password,
                trimmed,
                data.amount.trim(),
                (data.memo ?? "").trim(),
            );
            const result = await submitTransaction(signedTxJson);
            if (result.ok) {
                toast.success("Transaction submitted", {
                    description: result.txHash ? `Tx: ${result.txHash}` : "Sent to the Amadeus network.",
                });
                addSentTransaction({
                    senderPublicKey: publicKeyBase58,
                    txHash: result.txHash ?? "",
                    recipient: trimmed,
                    amount: data.amount.trim(),
                    memo: (data.memo ?? "").trim() || undefined,
                    timestamp: Date.now(),
                });
                setValue("recipientAddress", "");
                setValue("amount", "");
                setValue("memo", "");
                setValue("password", "");
                refetchBalance();
            } else {
                const description = result.error
                    ? result.networkError
                        ? `Cannot reach the network: ${result.error}`
                        : result.error
                    : "The network is unavailable or rejected the transaction. Please try again later.";
                toast.error("Transaction could not be submitted", { description });
            }
        } catch (e) {
            console.error(e);
            const msg = getErrorMessage(e);
            toast.error("Failed to send", { description: msg });
        } finally {
            setIsSubmitting(false);
        }
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
                        <SendIcon className="h-5 w-5" />
                        Send
                    </CardTitle>
                    <CardDescription>
                        Send funds over the Amadeus network. Enter the recipient address (Base58), amount, and your wallet password to sign the transaction. You can also paste a request link from the Receive page to pre-fill recipient, amount, and memo.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handlePasteRequestLink}
                                className="gap-2"
                            >
                                <LinkIcon className="size-4" />
                                Paste request link
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="send-recipient" className="text-sm font-medium">
                                Recipient address
                            </Label>
                            <Controller
                                name="recipientAddress"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        <Input
                                            id="send-recipient"
                                            placeholder="Base58 public key (e.g. 2xKz...)"
                                            className="font-mono text-sm"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                setAddressValid(null);
                                            }}
                                        />
                                        {addressValidating && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Loader2Icon className="size-3 animate-spin" />
                                                Validating address…
                                            </p>
                                        )}
                                        {!addressValidating && addressValid === true && (
                                            <p className="text-xs text-green-600 dark:text-green-400">Valid Amadeus address</p>
                                        )}
                                        {!addressValidating && addressValid === false && (
                                            <p className="text-xs text-destructive">Invalid Amadeus address (must be Base58, 48 bytes)</p>
                                        )}
                                    </>
                                )}
                            />
                            {errors.recipientAddress && (
                                <p className="text-xs text-destructive">{errors.recipientAddress.message}</p>
                            )}
                            {recentAddresses.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <span className="text-xs text-muted-foreground w-full">Recent:</span>
                                    {recentAddresses.map((addr) => (
                                        <Button
                                            key={addr}
                                            type="button"
                                            variant="outline"
                                            size="xs"
                                            className="font-mono max-w-[180px] truncate"
                                            onClick={() => onSelectRecent(addr)}
                                        >
                                            {addr.slice(0, 8)}…{addr.slice(-6)}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="send-amount" className="text-sm font-medium">
                                Amount
                            </Label>
                            <Controller
                                name="amount"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="send-amount"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0"
                                        {...field}
                                    />
                                )}
                            />
                            {errors.amount && (
                                <p className="text-xs text-destructive">{errors.amount.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="send-memo" className="text-sm font-medium">
                                Memo (optional)
                            </Label>
                            <Controller
                                name="memo"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="send-memo"
                                        placeholder="e.g. Payment for invoice"
                                        maxLength={256}
                                        {...field}
                                    />
                                )}
                            />
                            {errors.memo && (
                                <p className="text-xs text-destructive">{errors.memo.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="send-password" className="text-sm font-medium">
                                Wallet password
                            </Label>
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        id="send-password"
                                        type="password"
                                        placeholder="Enter password to sign transaction"
                                        autoComplete="current-password"
                                        {...field}
                                    />
                                )}
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Your password is used only to sign the transaction locally; it is not sent over the network.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end mt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2Icon className="size-4 animate-spin" />
                                    Preparing…
                                </>
                            ) : (
                                <>
                                    <SendIcon className="size-4" />
                                    Send
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
