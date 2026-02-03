import { globals } from "@/lib/globals";

export type ParsedRequestLink = {
    address: string;
    amount?: string;
    memo?: string;
};

export function parseRequestLink(uri: string): ParsedRequestLink | null {
    const trimmed = (uri ?? "").trim();
    if (!trimmed.toLowerCase().startsWith(globals.AMADEUS_URI_PREFIX.toLowerCase())) {
        return null;
    }
    const withoutPrefix = trimmed.slice(globals.AMADEUS_URI_PREFIX.toLowerCase().length);
    const [addressPart, queryPart] = withoutPrefix.split("?", 2);
    const address = addressPart?.trim() ?? "";
    if (!address) return null;

    const result: ParsedRequestLink = { address };

    if (queryPart) {
        try {
            const params = new URLSearchParams(queryPart);
            const amount = params.get("amount")?.trim();
            const memo = params.get("memo")?.trim();
            if (amount) result.amount = amount;
            if (memo) result.memo = memo;
        } catch {
            // ignore malformed query
        }
    }

    return result;
}
