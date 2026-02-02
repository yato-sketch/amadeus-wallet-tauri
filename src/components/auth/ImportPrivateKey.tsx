import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Contexts
import { useWallet } from "@/contexts/WalletContext";

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
    InputGroupTextarea,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import {
    EyeIcon,
    EyeOffIcon,
    KeyRoundIcon,
    Loader2Icon,
    ArrowLeftIcon,
} from "lucide-react";

// Lib
import {
    createPasswordSchema,
    importWalletSchema,
    type ImportWalletForm,
} from "@/lib/schemas";
import { importWallet, getPublicKeyFromPrivate } from "@/lib/wallet";

type Step = "password" | "private-key";

type ImportPrivateKeyProps = {
    onBack?: () => void;
    onSuccess?: () => void;
};

export default function ImportPrivateKey({ onBack, onSuccess }: ImportPrivateKeyProps) {
    const navigate = useNavigate();
    const { setWallet } = useWallet();
    const [step, setStep] = useState<Step>("password");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        handleSubmit,
        control,
        getValues,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm<ImportWalletForm>({
        resolver: zodResolver(importWalletSchema),
        defaultValues: {
            privateKey: "",
            password: "",
            confirmPassword: "",
        },
        mode: "onSubmit",
    });

    useEffect(() => {
        if (errors.privateKey?.message) toast.error(errors.privateKey.message);
        if (errors.password?.message) toast.error(errors.password.message);
        if (errors.confirmPassword?.message) toast.error(errors.confirmPassword.message);
    }, [errors.privateKey?.message, errors.password?.message, errors.confirmPassword?.message]);

    const onPasswordStepSubmit = async () => {
        const password = getValues("password");
        const confirmPassword = getValues("confirmPassword");
        const result = createPasswordSchema.safeParse({ password, confirmPassword });
        if (!result.success) {
            const err = result.error.flatten().fieldErrors;
            if (err.password?.[0]) setError("password", { message: err.password[0] });
            if (err.confirmPassword?.[0]) setError("confirmPassword", { message: err.confirmPassword[0] });
            return;
        }
        clearErrors(["password", "confirmPassword"]);
        setStep("private-key");
    };

    const onImportSubmit = async (data: ImportWalletForm) => {
        try {
            const privateKeyBase58 = data.privateKey.trim();
            await importWallet(privateKeyBase58, data.password);
            const publicKeyHex = await getPublicKeyFromPrivate(privateKeyBase58);
            setWallet(publicKeyHex, privateKeyBase58);
            toast.success("Wallet imported", {
                description: "Your wallet is ready. Keep your password safe.",
            });
            onSuccess?.();
            navigate("/", { state: { publicKeyHex, privateKeyBase58 }, replace: true });
        } catch (e) {
            const msg = getErrorMessage(e);
            toast.error("Failed to import wallet", { description: msg });
        }
    };

    if (step === "private-key") {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRoundIcon className="h-5 w-5" />
                        Enter your private key
                    </CardTitle>
                    <CardDescription>
                        Paste or type your existing private key (Base58, 64 bytes) to import the wallet.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onImportSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="import-private-key"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Existing private key
                            </label>
                            <Controller
                                name="privateKey"
                                control={control}
                                render={({ field }) => (
                                    <InputGroup
                                        className={`min-h-[80px] ${errors.privateKey ? "border-destructive" : ""}`}
                                    >
                                        <InputGroupTextarea
                                            {...field}
                                            id="import-private-key"
                                            placeholder="Paste or type your private key (Base58, 64 bytes)..."
                                            rows={3}
                                            className="resize-none"
                                            aria-invalid={!!errors.privateKey}
                                        />
                                    </InputGroup>
                                )}
                            />
                        </div>
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
                            Import wallet
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full gap-2"
                            onClick={() => setStep("password")}
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRoundIcon className="h-5 w-5" />
                    Import from private key
                </CardTitle>
                <CardDescription>
                    Set a password to encrypt your imported wallet. You will need it to unlock the wallet.
                </CardDescription>
            </CardHeader>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onPasswordStepSubmit();
                }}
            >
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
                        Continue
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
