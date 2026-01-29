import { useState, useEffect } from "react";
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
    InputGroupTextarea,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    EyeIcon,
    EyeOffIcon,
    KeyRoundIcon,
    Loader2Icon,
    ArrowLeftIcon,
} from "lucide-react";

// Schemas
import { importWalletSchema, type ImportWalletForm } from "@/lib/schemas";

type ImportPrivateKeyProps = {
    onBack?: () => void;
    onSuccess?: () => void;
};

export default function ImportPrivateKey({ onBack, onSuccess }: ImportPrivateKeyProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        handleSubmit,
        control,
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

    const onSubmit = async (_data: ImportWalletForm) => {
        toast.success("Wallet imported", {
            description: "Your wallet is ready. Keep your password safe.",
        });
        onSuccess?.();
    };

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <KeyRoundIcon className="h-5 w-5" />
                    Import from private key
                </CardTitle>
                <CardDescription>
                    Paste or type your existing private key (hex), then set a password to encrypt the wallet.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
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
                                        placeholder="Paste or type your private key (hex)..."
                                        rows={3}
                                        className="resize-none"
                                        aria-invalid={!!errors.privateKey}
                                    />
                                </InputGroup>
                            )}
                        />
                    </div>
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
                        Import wallet
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
