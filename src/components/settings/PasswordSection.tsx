import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { KeyRoundIcon, Loader2Icon } from "lucide-react";

type Props = {
    currentPassword: string;
    onCurrentPasswordChange: (value: string) => void;
    newPassword: string;
    onNewPasswordChange: (value: string) => void;
    confirmPassword: string;
    onConfirmPasswordChange: (value: string) => void;
    changingPassword: boolean;
    onChangePassword: () => void;
};

export function PasswordSection({
    currentPassword,
    onCurrentPasswordChange,
    newPassword,
    onNewPasswordChange,
    confirmPassword,
    onConfirmPasswordChange,
    changingPassword,
    onChangePassword,
}: Props) {
    return (
        <section id="password" className="scroll-mt-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <KeyRoundIcon className="h-5 w-5" />
                        Change password
                    </CardTitle>
                    <CardDescription>
                        Set a new unlock password. You'll need it next time you open the app.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="current-pw" className="text-sm font-medium block mb-1.5">
                            Current password
                        </Label>
                        <Input
                            id="current-pw"
                            type="password"
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => onCurrentPasswordChange(e.target.value)}
                            autoComplete="current-password"
                            className="max-w-xs"
                        />
                    </div>
                    <div>
                        <Label htmlFor="new-pw" className="text-sm font-medium block mb-1.5">
                            New password
                        </Label>
                        <p className="text-xs text-muted-foreground mb-1.5">
                            At least 8 characters; include upper, lower, number, and special character (!@#$%^&*()).
                        </p>
                        <Input
                            id="new-pw"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => onNewPasswordChange(e.target.value)}
                            autoComplete="new-password"
                            className="max-w-xs"
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirm-pw" className="text-sm font-medium block mb-1.5">
                            Confirm new password
                        </Label>
                        <Input
                            id="confirm-pw"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => onConfirmPasswordChange(e.target.value)}
                            autoComplete="new-password"
                            className="max-w-xs"
                        />
                    </div>
                    <Button
                        onClick={onChangePassword}
                        disabled={changingPassword || !currentPassword.trim() || !newPassword.trim()}
                    >
                        {changingPassword ? (
                            <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Change password
                    </Button>
                </CardContent>
            </Card>
        </section>
    );
}
