import { useState, useEffect } from "react";
import { toast } from "sonner";

// Components
import { NetworkSection } from "@/components/settings/NetworkSection";

// Lib
import { getAmadeusApiUrl, setAmadeusApiUrl, checkNodeHealth } from "@/lib/wallet";
import { globals } from "@/lib/globals";
import { copyToClipboard, getErrorMessage } from "@/lib/utils";

export default function NetworkPage() {
    const [apiUrl, setApiUrl] = useState("");
    const [saved, setSaved] = useState(false);
    const [checking, setChecking] = useState(false);
    const [healthMessage, setHealthMessage] = useState<string | null>(null);

    useEffect(() => {
        setApiUrl(getAmadeusApiUrl());
    }, []);

    const handleSave = () => {
        const trimmed = apiUrl.trim().replace(/\/$/, "");
        if (!trimmed) {
            setAmadeusApiUrl("");
            setApiUrl(globals.AMADEUS_NODE_API_URL);
            setSaved(true);
            toast.success("Reset to default", {
                description: globals.AMADEUS_NODE_API_URL,
            });
            return;
        }
        try {
            new URL(trimmed);
        } catch {
            toast.error("Invalid URL", {
                description: "Use a valid URL (e.g. https://api.example.com).",
            });
            return;
        }
        setAmadeusApiUrl(trimmed);
        setSaved(true);
        toast.success("API URL saved");
    };

    const handleResetToDefault = () => {
        setAmadeusApiUrl("");
        setApiUrl(globals.AMADEUS_NODE_API_URL);
        setSaved(true);
        setHealthMessage(null);
        toast.success("Reset to default");
    };

    const handleCheckConnection = async () => {
        const url = apiUrl.trim().replace(/\/$/, "") || getAmadeusApiUrl();
        if (!url) {
            toast.error("Enter an API URL first");
            return;
        }
        setChecking(true);
        setHealthMessage(null);
        try {
            const result = await checkNodeHealth(url);
            setHealthMessage(result.message);
            if (result.ok) toast.success("Node reachable");
            else toast.error("Node unreachable");
        } catch (e) {
            const msg = getErrorMessage(e);
            setHealthMessage(msg);
            toast.error("Check failed");
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <NetworkSection
                apiUrl={apiUrl}
                onApiUrlChange={setApiUrl}
                saved={saved}
                onSavedChange={setSaved}
                onSave={handleSave}
                onResetToDefault={handleResetToDefault}
                onCheckConnection={handleCheckConnection}
                checking={checking}
                healthMessage={healthMessage}
                onCopy={copyToClipboard}
            />
        </div>
    );
}
