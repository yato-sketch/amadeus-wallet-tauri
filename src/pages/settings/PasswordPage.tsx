import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { KeyRoundIcon } from "lucide-react";

// Lib
import { hasWallet, changeWalletPassword } from "@/lib/wallet";
import { changePasswordSchema } from "@/lib/schemas";
import { getErrorMessage } from "@/lib/utils";

export default function PasswordPage() {
    const [walletExists, setWalletExists] = useState<boolean | null>(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        hasWallet().then(setWalletExists).catch(() => setWalletExists(false));
    }, []);

    const handleChangePassword = async () => {
        const result = changePasswordSchema.safeParse({
            currentPassword,
            newPassword,
            confirmPassword,
        });
        if (!result.success) {
            const first = result.error.issues[0];
            const msg = first?.message ?? "Invalid password";
            toast.error(msg);
            return;
        }

        setChangingPassword(true);
        try {
            await changeWalletPassword(currentPassword, newPassword);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success("Password changed", {
                description: "Use the new password next time you unlock.",
            });
        } catch (e) {
            const msg = getErrorMessage(e);
            toast.error("Password change failed", { description: msg });
        } finally {
            setChangingPassword(false);
        }
    };

    if (walletExists === null) {
        return (
            <div className="max-w-2xl rounded-lg border bg-muted/30 p-8 text-center text-muted-foreground">
                <p className="text-sm">Checking wallet…</p>
            </div>
        );
    }

    if (!walletExists) {
        return (
            <div className="max-w-2xl rounded-lg border bg-muted/30 p-8 text-center space-y-4">
                <KeyRoundIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                    <p className="font-medium text-foreground">No wallet yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create or import a wallet to set a password.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link to="/">Go to Dashboard</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <PasswordSection
                currentPassword={currentPassword}
                onCurrentPasswordChange={setCurrentPassword}
                newPassword={newPassword}
                onNewPasswordChange={setNewPassword}
                confirmPassword={confirmPassword}
                onConfirmPasswordChange={setConfirmPassword}
                changingPassword={changingPassword}
                onChangePassword={handleChangePassword}
            />
        </div>
    );
}
