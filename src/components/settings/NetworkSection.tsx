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
import { GlobeIcon, CopyIcon, RotateCcwIcon, Loader2Icon, CheckCircleIcon, XCircleIcon } from "lucide-react";

// Lib
import { globals } from "@/lib/globals";

type Props = {
    apiUrl: string;
    onApiUrlChange: (value: string) => void;
    saved: boolean;
    onSavedChange: (value: boolean) => void;
    onSave: () => void;
    onResetToDefault: () => void;
    onCheckConnection: () => void;
    checking: boolean;
    healthMessage: string | null;
    onCopy: (text: string, label: string) => void;
};

export function NetworkSection({
    apiUrl,
    onApiUrlChange,
    saved,
    onSavedChange,
    onSave,
    onResetToDefault,
    onCheckConnection,
    checking,
    healthMessage,
    onCopy,
}: Props) {
    return (
        <section id="network" className="scroll-mt-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <GlobeIcon className="h-5 w-5" />
                        Network
                    </CardTitle>
                    <CardDescription>
                        Node API used for balance, transactions, and sending.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="api-url" className="text-sm font-medium block mb-1.5">
                            API URL
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="api-url"
                                type="url"
                                placeholder={globals.AMADEUS_NODE_API_URL}
                                value={apiUrl}
                                onChange={(e) => {
                                    onApiUrlChange(e.target.value);
                                    onSavedChange(false);
                                }}
                                className="font-mono flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                title="Copy URL"
                                onClick={() =>
                                    onCopy(apiUrl || globals.AMADEUS_NODE_API_URL, "API URL")
                                }
                            >
                                <CopyIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={onSave}>
                            {saved ? "Saved" : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={onResetToDefault}>
                            <RotateCcwIcon className="h-3.5 w-3.5 mr-1" />
                            Default
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onCheckConnection}
                            disabled={checking}
                        >
                            {checking ? (
                                <Loader2Icon className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : null}
                            Test connection
                        </Button>
                    </div>
                    {healthMessage != null && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            {healthMessage.startsWith("OK") ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                            ) : (
                                <XCircleIcon className="h-4 w-4 text-destructive shrink-0" />
                            )}
                            {healthMessage}
                        </p>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
