import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// Shadcn UI
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon, ChevronDownIcon, CreditCardIcon, ChevronRightIcon, DatabaseIcon, GlobeIcon, HomeIcon, InfoIcon, KeyRoundIcon, LogOutIcon, MailIcon, MenuIcon, MessageSquareIcon, NewspaperIcon, SendIcon, SettingsIcon, WalletIcon } from "lucide-react";

// Contexts
import { useWallet } from "@/contexts/WalletContext";

// Hooks
import { useIsMobile } from "@/hooks/use-mobile";

// Lib
import { cn } from "@/lib/utils";
import { SETTINGS_PAGE_LABELS } from "@/lib/settings";

// Assets
import AMALogoSlogan from "@/assets/home/AMA-logo-slogan.png";
import DarkLogo from "@/assets/amadeus-logo-dark.svg";
import { toast } from "sonner";

import { BottomNav } from "./BottomNav";

const navItems = [
    { to: "/", label: "Home", icon: HomeIcon },
    { to: "/transactions", label: "Transactions", icon: CreditCardIcon },
    { to: "/wallet/receive", label: "My Wallet", icon: WalletIcon, subItems: [
        { to: "/wallet/send", label: "Send", icon: SendIcon },
        { to: "/wallet/receive", label: "Receive", icon: ArrowDownIcon },
    ] },
    { to: "/settings", label: "Settings", icon: SettingsIcon, subItems: [
        { to: "/settings/network", label: "Network", icon: GlobeIcon },
        { to: "/settings/password", label: "Password", icon: KeyRoundIcon },
        { to: "/settings/wallet", label: "Wallet file", icon: WalletIcon },
        { to: "/settings/data", label: "Data", icon: DatabaseIcon },
        { to: "/settings/about", label: "About", icon: InfoIcon },
    ] },
];

const newsItems = [
    { to: "/news", label: "News", icon: NewspaperIcon },
];

type NavItem = (typeof navItems)[number];

function getHeaderBreadcrumb(pathname: string): { parent?: { to: string; label: string }; current: string } {
    if (pathname === "/" || pathname === "") return { current: "Home" };
    if (pathname === "/transactions") return { current: "Transactions" };
    if (pathname === "/news") return { current: "News" };
    if (pathname === "/feedback") return { current: "Feedback" };
    if (pathname.startsWith("/wallet")) {
        if (pathname === "/wallet/send") return { parent: { to: "/wallet/receive", label: "My Wallet" }, current: "Send" };
        if (pathname === "/wallet/receive") return { parent: { to: "/wallet/receive", label: "My Wallet" }, current: "Receive" };
        return { current: "My Wallet" };
    }
    if (pathname.startsWith("/settings")) {
        const segment = pathname.split("/").filter(Boolean)[1];
        const current = segment ? (SETTINGS_PAGE_LABELS[segment] ?? "Settings") : "Settings";
        return { parent: { to: "/settings", label: "Settings" }, current };
    }
    const segment = pathname.split("/")[1];
    return { current: segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Home" };
}

function NavItemWithSub({
    item,
    pathname,
    pathWithHash,
    openGroupKey,
    setOpenGroupKey,
}: {
    item: NavItem;
    pathname: string;
    pathWithHash: string;
    openGroupKey: string | null;
    setOpenGroupKey: (key: string | null) => void;
}) {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const isGroupOpen = openGroupKey === item.to;

    if (!item.subItems) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === item.to} tooltip={item.label}>
                    <Link to={item.to}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    if (isCollapsed) {
        return (
            <SidebarMenuItem>
                <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        <SidebarMenuButton asChild isActive={pathname === item.to || pathWithHash.startsWith(item.to)}>
                            <Link to={item.to}>
                                <item.icon className="size-4" />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" align="start" className="w-48 p-1">
                        <nav className="flex flex-col gap-0.5">
                            {item.subItems.map((subItem) => (
                                <Link
                                    key={subItem.to}
                                    to={subItem.to}
                                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${pathWithHash === subItem.to ? "bg-accent font-medium" : ""}`}
                                >
                                    <subItem.icon className="size-4 shrink-0" />
                                    <span>{subItem.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </HoverCardContent>
                </HoverCard>
            </SidebarMenuItem>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                isActive={pathname === item.to || pathWithHash.startsWith(item.to)}
                onClick={() => setOpenGroupKey(isGroupOpen ? null : item.to)}
                className="cursor-pointer"
            >
                <item.icon className="size-4" />
                <span>{item.label}</span>
                <ChevronDownIcon
                    className={cn("ml-auto size-4 shrink-0 transition-transform", isGroupOpen && "rotate-180")}
                    aria-hidden
                />
            </SidebarMenuButton>
            {isGroupOpen && (
                <SidebarMenuSub className="border-border">
                    {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.to}>
                            <SidebarMenuSubButton asChild isActive={pathWithHash === subItem.to}>
                                <Link to={subItem.to}>
                                    <subItem.icon className="size-4" />
                                    <span>{subItem.label}</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    );
}

function getDefaultOpenGroup(pathname: string): string | null {
    if (pathname.startsWith("/wallet")) return "/wallet/receive";
    if (pathname.startsWith("/settings")) return "/settings";
    return null;
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearWallet } = useWallet();
    const isMobile = useIsMobile();
    const pathWithHash = location.pathname + (location.hash || "");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openGroupKey, setOpenGroupKey] = useState<string | null>(() =>
        getDefaultOpenGroup(location.pathname)
    );

    useEffect(() => {
        const next = getDefaultOpenGroup(location.pathname);
        if (next != null) setOpenGroupKey(next);
    }, [location.pathname]);

    const handleLogout = () => {
        clearWallet();
        toast.success("Logged out");
        navigate("/auth/login", { replace: true });
        setMobileMenuOpen(false);
    };

    const { current } = getHeaderBreadcrumb(location.pathname);

    if (isMobile) {
        return (
            <div className="flex min-h-dvh flex-col bg-background">
                <header className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center border-b border-border bg-background pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[env(safe-area-inset-top)] pb-3">
                    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="flex min-w-0 items-center justify-start">
                            <img src={DarkLogo} alt="Amadeus" className="size-8 shrink-0 object-contain" />
                        </div>
                        <span className="min-w-0 truncate text-center text-base font-medium text-foreground" aria-hidden="true">
                            {current}
                        </span>
                        <div className="flex min-w-0 items-center justify-end">
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 min-h-10 w-10 min-w-10 shrink-0" aria-label="Open menu">
                                        <MenuIcon className="size-5" />
                                    </Button>
                                </SheetTrigger>
                        <SheetContent side="right" className="w-64">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <nav className="mt-6 flex flex-col gap-1">
                                <Button variant="ghost" className="justify-start h-12 min-h-12" asChild>
                                    <Link to="/news" onClick={() => setMobileMenuOpen(false)}>
                                        <NewspaperIcon className="size-5 mr-3" />
                                        News
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="justify-start h-12 min-h-12" asChild>
                                    <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
                                        <MailIcon className="size-5 mr-3" />
                                        Contact
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="justify-start h-12 min-h-12" asChild>
                                    <Link to="/feedback" onClick={() => setMobileMenuOpen(false)}>
                                        <MessageSquareIcon className="size-5 mr-3" />
                                        Feedback
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="justify-start h-12 min-h-12 text-muted-foreground"
                                    onClick={handleLogout}
                                >
                                    <LogOutIcon className="size-5 mr-3" />
                                    Logout
                                </Button>
                            </nav>
                        </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                    {children}
                </main>
                <BottomNav />
            </div>
        );
    }

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader className="">
                    <div className="flex items-center justify-start h-full pl-2 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:pl-0 group-data-[state=collapsed]:p-0">
                        <img src={AMALogoSlogan} alt="Amadeus Logo" className="w-auto h-auto object-contain group-data-[state=collapsed]:hidden" />
                        <img src={DarkLogo} alt="Amadeus" className="size-8 object-contain hidden group-data-[state=collapsed]:block" />
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Wallet</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navItems.map((item) => (
                                    <NavItemWithSub
                                        key={item.to}
                                        item={item}
                                        pathname={location.pathname}
                                        pathWithHash={pathWithHash}
                                        openGroupKey={openGroupKey}
                                        setOpenGroupKey={setOpenGroupKey}
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                    <SidebarGroup>
                        <SidebarGroupLabel>News</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {newsItems.map((item) => (
                                    <SidebarMenuItem key={item.to}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={location.pathname === item.to}
                                            tooltip={item.label}
                                        >
                                            <Link to={item.to}>
                                                <item.icon className="size-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="text-muted-foreground" size="sm" asChild tooltip="Contact">
                                <Link to="/contact">
                                    <MailIcon className="size-4" />
                                    <span>Contact</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton className="text-muted-foreground" size="sm" asChild tooltip="Feedback">
                                <Link to="/feedback">
                                    <MessageSquareIcon className="size-4" />
                                    <span>Feedback</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem className="border-t pt-2">
                            <SidebarMenuButton
                                className="text-muted-foreground"
                                size="sm"
                                tooltip="Logout"
                                onClick={handleLogout}
                            >
                                <LogOutIcon className="size-4" />
                                <span>Logout</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="sticky bg-background top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
                        {(() => {
                            const { parent, current } = getHeaderBreadcrumb(location.pathname);
                            return (
                                <>
                                    {parent ? (
                                        <>
                                            <Link
                                                to={parent.to}
                                                className="text-muted-foreground hover:text-foreground transition-colors truncate"
                                            >
                                                {parent.label}
                                            </Link>
                                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </>
                                    ) : null}
                                    <span className="font-medium text-foreground truncate">{current}</span>
                                </>
                            );
                        })()}
                    </nav>
                </header>
                <div className="flex-1 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
