import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Shadcn UI
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// Components
import { CreatePrivateKey, ImportPrivateKey } from "@/components/auth";
import { useAuthLayoutContext } from "@/components/layout/AuthLayout";

// Assets
import { ArrowLeftIcon } from "lucide-react";
import CreatePrivateKeyPng from "@/assets/auth/create-private-key.png";
import ImportPrivateKeyPng from "@/assets/auth/import-private-key.png";

const options = [
    {
        id: 1,
        badge: "Recommended",
        title: "Create one from a private key",
        description: "Create a new wallet from a private key",
        action: "create-from-private-key",
        image: CreatePrivateKeyPng,
    },
    {
        id: 2,
        badge: "Not recommended",
        title: "Import from an existing private key",
        description: "Import a wallet from an existing private key",
        action: "import-from-private-key",
        image: ImportPrivateKeyPng,
    },

]

type Step = "intro" | "create-from-private-key" | "import-from-private-key";

export default function RegisterPage() {
    const [step, setStep] = useState<Step>("intro");
    const navigate = useNavigate();
    const setHideBranding = useAuthLayoutContext()?.setHideBranding;

    useEffect(() => {
        setHideBranding?.(step === "intro");
        return () => setHideBranding?.(false);
    }, [step, setHideBranding]);

    return (
        <div className="relative w-full flex items-center justify-center gap-4">
            {step === "intro" && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed left-4 top-4 z-20 gap-2"
                    onClick={() => navigate("/auth/login")}
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                </Button>
            )}
            {step === "intro" && options.map((option) => (
                <Card key={option.id} className="group relative w-full max-w-sm pt-0 overflow-hidden select-none">
                    <div className="overflow-hidden rounded-t-xl">
                        <img
                            src={option.image}
                            alt={option.title}
                            className="aspect-video w-full object-cover brightness-60 dark:brightness-40 grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:scale-105"
                        />
                    </div>
                    <CardHeader>
                        <CardAction>
                            <Badge variant="secondary">{option.badge}</Badge>
                        </CardAction>
                        <CardTitle>{option.title}</CardTitle>
                        <CardDescription>
                            {option.description}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" onClick={() => setStep(option.action as Step)}>Choose</Button>
                    </CardFooter>
                </Card>
            ))}
            {step === "create-from-private-key" && (
                <CreatePrivateKey onBack={() => setStep("intro")} />
            )}
            {step === "import-from-private-key" && (
                <ImportPrivateKey onBack={() => setStep("intro")} />
            )}
        </div>
    );
}