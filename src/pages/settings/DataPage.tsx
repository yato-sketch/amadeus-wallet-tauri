import { useState } from "react";

// Lib
import { clearAllSentTransactions } from "@/lib/transactions";
import { toast } from "sonner";

// Components
import { DataSection } from "@/components/settings/DataSection";

export default function DataPage() {
    const [clearingHistory, setClearingHistory] = useState(false);

    const handleClearSentHistory = () => {
        if (
            !window.confirm(
                "Clear local sent transaction cache? History will reload from the node."
            )
        )
            return;
        setClearingHistory(true);
        try {
            clearAllSentTransactions();
            toast.success("Local history cleared");
        } finally {
            setClearingHistory(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <DataSection
                clearingHistory={clearingHistory}
                onClearSentHistory={handleClearSentHistory}
            />
        </div>
    );
}
