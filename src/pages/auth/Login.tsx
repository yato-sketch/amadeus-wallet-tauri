import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Contexts
import { useWallet } from "@/contexts/WalletContext";

// Shadcn UI
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
    Loader2Icon,
    WalletIcon,
} from "lucide-react";

// Lib
import { loginSchema } from "@/lib/schemas";
import { unlockWallet } from "@/lib/wallet";
import { getErrorMessage } from "@/lib/utils";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { setPublicKeyOnly } = useWallet();
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            password: "",
        },
        mode: "onSubmit",
    });

    useEffect(() => {
        if (errors.password) {
            toast.error(errors.password.message);
        }
    }, [errors.password]);

    const onSubmit = async (data: LoginForm) => {
        try {
            const publicKeyBase58 = await unlockWallet(data.password);
            setPublicKeyOnly(publicKeyBase58);
            toast.success("Wallet unlocked");
            navigate("/", { state: { publicKeyBase58 }, replace: true });
        } catch (e) {
            const msg = getErrorMessage(e);
            toast.error("Failed to unlock wallet", { description: msg });
        }
    };

    return (
        <>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full max-w-sm space-y-4 px-4"
            >
                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <InputGroup>
                            <InputGroupInput
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
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

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center gap-2"
                >
                    {isSubmitting ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                        <WalletIcon className="h-4 w-4" />
                    )}
                    <span>Open Wallet</span>
                </Button>
                <div className="text-sm text-muted-foreground text-center">
                    <p>Forgot your password? <Link to="/auth/restore" className="text-white hover:text-white/80 hover:underline">Restore it</Link> now</p>
                    <p>Don't have a wallet? <Link to="/auth/register" className="text-white hover:text-white/80 hover:underline">Create one</Link> now</p>
                </div>
            </form>
        </>
    );
}
