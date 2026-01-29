import { createContext, useContext, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircleIcon, BookOpenIcon } from "lucide-react";

// Lib
import { globals } from "@/lib/globals";

// Assets
import DarkLogo from "@/assets/amadeus-logo-dark.svg";

const DOCS_URL = globals.DOCS_URL || "";

type AuthLayoutContextValue = {
    hideBranding: boolean;
    setHideBranding: (hide: boolean) => void;
};

const AuthLayoutContext = createContext<AuthLayoutContextValue | null>(null);

export function useAuthLayoutContext() {
    const ctx = useContext(AuthLayoutContext);
    return ctx;
}

export default function AuthLayout() {
    const navigate = useNavigate();
    const [hideBranding, setHideBranding] = useState<boolean>(false);

    const openDocs = async () => {
        try {
            await openUrl(DOCS_URL);
        } catch (e) {
            if (typeof window.open !== "undefined") {
                window.open(DOCS_URL, "_blank");
            } else {
                console.error("Failed to open URL:", e);
                toast.error("Could not open link. Please open https://docs.ama.one in your browser.");
            }
        }
    };

    const contactSupport = () => {
        navigate("/support");
    };

    return (
        <AuthLayoutContext.Provider value={{ hideBranding, setHideBranding }}>
            <div className="relative flex flex-col items-center justify-center h-screen">
                {!hideBranding && (
                    <div className="mb-6 flex flex-col items-center gap-2 select-none">
                        <img src={DarkLogo} alt="Amadeus Logo" className="w-36 h-36 object-contain" />
                        <h1 className="text-3xl font-bold">Amadeus Protocol</h1>
                    </div>
                )}
                <Outlet />
                <div className="absolute bottom-4 right-4 z-10 flex items-center justify-end">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" className="rounded-full hover:bg-accent hover:text-accent-foreground" size="icon" onClick={openDocs}>
                                <BookOpenIcon className="w-4 h-4 text-muted-foreground hover:text-foreground hover:bg-transparent" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>View the documentation in your browser</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" className="rounded-full hover:bg-accent hover:text-accent-foreground" size="icon" onClick={contactSupport}>
                                <HelpCircleIcon className="w-4 h-4 text-muted-foreground hover:text-foreground hover:bg-transparent" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Contact support</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </AuthLayoutContext.Provider>
    );
}