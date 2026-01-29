import { useState, useEffect, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// UI
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    EyeIcon,
    EyeOffIcon,
    KeyRoundIcon,
    Loader2Icon,
    ArrowLeftIcon,
    CopyIcon,
    DownloadIcon,
    CheckIcon,
} from "lucide-react";

// Schemas
import { createPasswordSchema, type CreatePasswordForm } from "@/lib/schemas";

/** This is mock function. */
function generatePrivateKeyHex(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

type CreatePrivateKeyProps = {
    onBack?: () => void;
    onSuccess?: () => void;
};

export default function CreatePrivateKey({ onBack, onSuccess }: CreatePrivateKeyProps) {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [createdPrivateKey, setCreatedPrivateKey] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<CreatePasswordForm>({
        resolver: zodResolver(createPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
        mode: "onSubmit",
    });

    useEffect(() => {
        if (errors.password?.message) toast.error(errors.password.message);
        if (errors.confirmPassword?.message) toast.error(errors.confirmPassword.message);
    }, [errors.password?.message, errors.confirmPassword?.message]);

    const onSubmit = async (_data: CreatePasswordForm) => {
        const privateKeyHex = generatePrivateKeyHex();
        setCreatedPrivateKey(privateKeyHex);
        toast.success("Wallet created", {
            description: "Save your private key below. You will need it to recover your wallet.",
        });
    };

    const copyToClipboard = useCallback(async () => {
        if (!createdPrivateKey) return;
        try {
            await navigator.clipboard.writeText(createdPrivateKey);
            setCopied(true);
            toast.success("Private key copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    }, [createdPrivateKey]);

    const downloadKey = useCallback(() => {
        if (!createdPrivateKey) return;
        const blob = new Blob([createdPrivateKey], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "amadeus-private-key.txt";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Private key downloaded");
    }, [createdPrivateKey]);

    if (createdPrivateKey) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRoundIcon className="h-5 w-5" />
                        Your private key
                    </CardTitle>
                    <CardDescription>
                        Save this key in a safe place. Anyone with this key can access your wallet. Do not share it.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm break-all select-all">
                        {createdPrivateKey}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={copyToClipboard}
                        >
                            {copied ? (
                                <CheckIcon className="h-4 w-4" />
                            ) : (
                                <CopyIcon className="h-4 w-4" />
                            )}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={downloadKey}
                        >
                            <DownloadIcon className="h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button
                        type="button"
                        className="w-full gap-2"
                        onClick={() => onSuccess?.()}
                    >
                        <KeyRoundIcon className="h-4 w-4" />
                        Continue to wallet
                    </Button>
                    {onBack && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full gap-2"
                            onClick={onBack}
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back
                        </Button>
                    )}
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRoundIcon className="h-5 w-5" />
                    Create from private key
                </CardTitle>
                <CardDescription>
                    Set a password to encrypt your new wallet. You will need it to unlock the wallet.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <InputGroup className={errors.password ? "border-destructive" : ""}>
                                <InputGroupInput
                                    {...field}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    aria-invalid={!!errors.password}
                                />
                                <InputGroupAddon align="inline-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-foreground hover:bg-transparent"
                                        onClick={() => setShowPassword((v) => !v)}
                                    >
                                        {showPassword ? (
                                            <EyeOffIcon className="h-4 w-4" />
                                        ) : (
                                            <EyeIcon className="h-4 w-4" />
                                        )}
                                    </Button>
                                </InputGroupAddon>
                            </InputGroup>
                        )}
                    />
                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                            <InputGroup className={errors.confirmPassword ? "border-destructive" : ""}>
                                <InputGroupInput
                                    {...field}
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Confirm password"
                                    aria-invalid={!!errors.confirmPassword}
                                />
                                <InputGroupAddon align="inline-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-foreground hover:bg-transparent"
                                        onClick={() => setShowConfirm((v) => !v)}
                                    >
                                        {showConfirm ? (
                                            <EyeOffIcon className="h-4 w-4" />
                                        ) : (
                                            <EyeIcon className="h-4 w-4" />
                                        )}
                                    </Button>
                                </InputGroupAddon>
                            </InputGroup>
                        )}
                    />
                </CardContent>
                <CardFooter className="flex flex-col gap-2 mt-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center gap-2"
                    >
                        {isSubmitting ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                            <KeyRoundIcon className="h-4 w-4" />
                        )}
                        Create wallet
                    </Button>
                    {onBack && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full gap-2"
                            onClick={onBack}
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back
                        </Button>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}
