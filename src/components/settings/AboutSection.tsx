import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InfoIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { globals } from "@/lib/globals";

type Props = {
    onCopy: (text: string, label: string) => void;
};

export function AboutSection({ onCopy }: Props) {
    return (
        <section id="about" className="scroll-mt-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <InfoIcon className="h-5 w-5" />
                        About
                    </CardTitle>
                    <CardDescription>
                        App version and links.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">App</span>
                        <span className="font-medium">
                            {globals.APP_NAME ?? "Amadeus Wallet"}
                            {globals.APP_VERSION ? ` v${globals.APP_VERSION}` : ""}
                        </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Default API</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs truncate max-w-[180px]">
                                {globals.AMADEUS_NODE_API_URL}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                title="Copy"
                                onClick={() =>
                                    onCopy(globals.AMADEUS_NODE_API_URL, "Default API URL")
                                }
                            >
                                <CopyIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                    {globals.DOCS_URL && (
                        <>
                            <Separator />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Docs</span>
                                <a
                                    href={globals.DOCS_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1"
                                >
                                    Open
                                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
