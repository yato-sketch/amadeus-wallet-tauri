import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatabaseIcon, Loader2Icon, Trash2Icon } from "lucide-react";

type Props = {
    clearingHistory: boolean;
    onClearSentHistory: () => void;
};

export function DataSection({ clearingHistory, onClearSentHistory }: Props) {
    return (
        <section id="data" className="scroll-mt-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DatabaseIcon className="h-5 w-5" />
                        Local data
                    </CardTitle>
                    <CardDescription>
                        Clear cached data. This does not affect the blockchain.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                        <div>
                            <p className="font-medium text-sm">Sent transaction cache</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Clears local list; transactions will reload from the node.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearSentHistory}
                            disabled={clearingHistory}
                        >
                            {clearingHistory ? (
                                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <>
                                    <Trash2Icon className="h-3.5 w-3.5 mr-1" />
                                    Clear
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
