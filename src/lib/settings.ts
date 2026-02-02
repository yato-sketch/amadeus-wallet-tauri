import type { LucideIcon } from "lucide-react";
import {
    GlobeIcon,
    KeyRoundIcon,
    WalletIcon,
    DatabaseIcon,
    InfoIcon,
} from "lucide-react";

export const SETTINGS_SECTIONS = ["network", "password", "wallet", "data", "about"] as const;
export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number];

export const SETTINGS_ROUTES = [
    { path: "network", label: "Network", icon: GlobeIcon },
    { path: "password", label: "Password", icon: KeyRoundIcon },
    { path: "wallet", label: "Wallet file", icon: WalletIcon },
    { path: "data", label: "Data", icon: DatabaseIcon },
    { path: "about", label: "About", icon: InfoIcon },
] as const satisfies ReadonlyArray<{
    path: SettingsSectionId;
    label: string;
    icon: LucideIcon;
}>;

export const SETTINGS_BASE_PATH = "/settings";

export const SETTINGS_PAGE_LABELS: Record<string, string> = {
    network: "Network",
    password: "Password",
    wallet: "Wallet file",
    data: "Data",
    about: "About",
};
