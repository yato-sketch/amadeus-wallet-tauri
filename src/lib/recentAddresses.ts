const RECENT_ADDRESSES_KEY = "amadeus-wallet-recent-addresses";
const RECENT_MAX = 10;

export function getRecentAddresses(): string[] {
    try {
        const raw = localStorage.getItem(RECENT_ADDRESSES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed)
            ? parsed.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX)
            : [];
    } catch {
        return [];
    }
}

export function addRecentAddress(address: string): void {
    const trimmed = address.trim();
    if (!trimmed) return;
    const recent = getRecentAddresses().filter((a) => a !== trimmed);
    recent.unshift(trimmed);
    try {
        localStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(recent.slice(0, RECENT_MAX)));
    } catch {
        // ignore
    }
}
