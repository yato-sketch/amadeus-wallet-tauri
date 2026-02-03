export const globals = {
    APP_NAME: import.meta.env.VITE_APP_NAME,
    APP_VERSION: import.meta.env.VITE_APP_VERSION,
    DOCS_URL: import.meta.env.VITE_DOCS_URL,
    WALLET_CHECK_TIMEOUT_MS: Number(import.meta.env.VITE_WALLET_CHECK_TIMEOUT_MS),
    AMADEUS_NODE_API_URL:
        (import.meta.env.VITE_AMADEUS_NODE_API_URL as string)?.replace(/\/$/, "") || "https://nodes.amadeus.bot",
    AMADEUS_URI_PREFIX: import.meta.env.VITE_AMADEUS_URI_PREFIX || "amadeus:",
};