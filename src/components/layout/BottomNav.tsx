import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    ArrowDownIcon,
    CreditCardIcon,
    HomeIcon,
    SendIcon,
    SettingsIcon,
    WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SETTINGS_BASE_PATH, SETTINGS_ROUTES } from "@/lib/settings";

const WALLET_SUBITEMS = [
    { to: "/wallet/receive", label: "Receive", icon: ArrowDownIcon },
    { to: "/wallet/send", label: "Send", icon: SendIcon },
] as const;

type NavItemBase = { label: string; icon: typeof HomeIcon };
type NavItemLink = NavItemBase & { to: string; subItems?: never };
type NavItemWithSub = NavItemBase & { id: "wallet" | "settings"; subItems: readonly { to: string; label: string; icon: typeof ArrowDownIcon }[] };

const MOBILE_NAV_ITEMS: (NavItemLink | NavItemWithSub)[] = [
    { to: "/", label: "Home", icon: HomeIcon },
    {
        id: "wallet",
        label: "Wallet",
        icon: WalletIcon,
        subItems: WALLET_SUBITEMS,
    },
    { to: "/transactions", label: "Transactions", icon: CreditCardIcon },
    {
        id: "settings",
        label: "Settings",
        icon: SettingsIcon,
        subItems: SETTINGS_ROUTES.map((r) => ({
            to: `${SETTINGS_BASE_PATH}/${r.path}`,
            label: r.label,
            icon: r.icon,
        })),
    },
];

export function BottomNav() {
    const location = useLocation();
    const pathname = location.pathname;
    const navigate = useNavigate();
    const [subSheetOpen, setSubSheetOpen] = useState(false);
    const [subSheetContent, setSubSheetContent] = useState<{
        title: string;
        items: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
    } | null>(null);

    const openSubSheet = (
        title: string,
        items: readonly { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[]
    ) => {
        setSubSheetContent({ title, items: [...items] });
        setSubSheetOpen(true);
    };

    const handleSubItemClick = (to: string) => {
        navigate(to);
        setSubSheetOpen(false);
    };

    const isActive = (item: NavItemLink | NavItemWithSub) => {
        if ("to" in item && item.to) {
            if (item.to === "/") return pathname === "/";
            if (item.to === "/transactions") return pathname === "/transactions";
            return pathname.startsWith(item.to);
        }
        if ("id" in item) {
            if (item.id === "wallet") return pathname.startsWith("/wallet");
            if (item.id === "settings") return pathname.startsWith("/settings");
        }
        return false;
    };

    return (
        <>
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 pb-[env(safe-area-inset-bottom)]"
                aria-label="Main navigation"
            >
                {MOBILE_NAV_ITEMS.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    if ("subItems" in item && item.subItems) {
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => openSubSheet(item.label, item.subItems)}
                                className={cn(
                                    "flex min-h-[56px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs transition-colors active:bg-muted/50",
                                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                                aria-expanded={subSheetOpen && subSheetContent?.title === item.label}
                                aria-haspopup="dialog"
                            >
                                <Icon className="size-6 shrink-0" aria-hidden />
                                <span>{item.label}</span>
                            </button>
                        );
                    }
                    const linkItem = item as NavItemLink;
                    return (
                        <Link
                            key={linkItem.to}
                            to={linkItem.to}
                            className={cn(
                                "flex min-h-[56px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs transition-colors active:bg-muted/50",
                                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            aria-current={active ? "page" : undefined}
                        >
                            <Icon className="size-6 shrink-0" aria-hidden />
                            <span>{linkItem.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <Sheet open={subSheetOpen} onOpenChange={setSubSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-xl pb-[env(safe-area-inset-bottom)]">
                    <SheetHeader>
                        <SheetTitle>{subSheetContent?.title}</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-0.5 px-4 pb-4">
                        {subSheetContent?.items.map(({ to, label, icon: SubIcon }) => (
                            <Button
                                key={to}
                                variant="ghost"
                                className="h-12 min-h-12 justify-start gap-3 text-base"
                                onClick={() => handleSubItemClick(to)}
                            >
                                <SubIcon className="size-5 shrink-0" />
                                <span>{label}</span>
                            </Button>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
