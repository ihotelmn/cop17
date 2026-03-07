"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/admin/notification-bell";
import { UserNav } from "@/components/user-nav";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, CalendarDays, LayoutDashboard, Menu } from "lucide-react";
import { SearchAwareLink } from "@/components/search-aware-link";

const primaryLinks = [
    { href: "/", label: "Home" },
    { href: "/#search", label: "Hotels" },
    { href: "/tours", label: "Tours" },
    { href: "/shuttle", label: "Shuttle" },
    { href: "/support", label: "Support" },
] as const;

export function SiteHeader() {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    const { user } = useAuth();

    // Hide auth section on login/signup pages to avoid "ghost session" confusion
    const showUserContent = Boolean(user) && !isAuthPage;
    const isAdminUser = !!user && (user.role === "admin" || user.role === "super_admin" || user.role === "liaison");


    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
            isHome
                ? "bg-black/20 backdrop-blur-md border-b border-white/5"
                : "bg-zinc-950/90 backdrop-blur-xl border-b border-white/10 shadow-2xl"
        )}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo */}
                <SearchAwareLink href="/" className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95">
                    <div className="relative">
                        <Image
                            src="/images/cop17-logo-horizontal.png"
                            alt="COP17 Logo"
                            width={120}
                            height={40}
                            className="h-9 w-auto object-contain brightness-0 invert drop-shadow-md"
                        />
                    </div>
                </SearchAwareLink>

                {/* Navigation */}
                <nav className="hidden lg:flex items-center gap-8">
                    <NavLink href="/" active={pathname === "/"} preserveSearch>Home</NavLink>
                    <NavLink href="/#search" active={pathname.startsWith("/hotels")} preserveSearch>Hotels</NavLink>
                    <NavLink href="/tours" active={pathname === "/tours"}>Tours</NavLink>
                    <NavLink href="/shuttle" active={pathname === "/shuttle"}>Shuttle</NavLink>
                    <NavLink href="/support" active={pathname === "/support"}>Support</NavLink>
                    <NavLink href="https://unccdcop17.org" external>About COP17</NavLink>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-6">
                    {showUserContent ? (
                        <>
                            <div className="hidden md:flex items-center gap-6">
                                <NavLink href="/my-bookings" active={pathname === "/my-bookings"}>My Bookings</NavLink>
                                {isAdminUser && (
                                    <Button asChild variant="ghost" className="text-[12px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-4">
                                        <Link href="/admin">Dashboard</Link>
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                {isAdminUser && (
                                    <NotificationBell userId={user!.id} />
                                )}
                                <UserNav />
                                <MobileHeaderMenu showUserContent={showUserContent} isAdminUser={isAdminUser} isAuthPage={isAuthPage} />
                            </div>
                        </>
                    ) : !isAuthPage && (
                        <div className="flex items-center gap-2 sm:gap-3 lg:gap-6">
                            <Link href="/login" className="hidden text-[12px] font-bold uppercase tracking-wider text-white/60 transition-all hover:text-white sm:inline-flex">
                                Sign In
                            </Link>
                            <Button asChild className="h-10 rounded-2xl bg-white px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition-all hover:scale-105 hover:bg-zinc-100 active:scale-95 sm:h-11 sm:px-8 sm:text-[12px] sm:tracking-wider">
                                <SearchAwareLink href="/#search">Book Stay</SearchAwareLink>
                            </Button>
                            <MobileHeaderMenu showUserContent={showUserContent} isAdminUser={isAdminUser} isAuthPage={isAuthPage} />
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}

function MobileHeaderMenu({
    showUserContent,
    isAdminUser,
    isAuthPage,
}: {
    showUserContent: boolean;
    isAdminUser: boolean;
    isAuthPage: boolean;
}) {
    const pathname = usePathname();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white lg:hidden"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="left-0 top-0 h-full max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-zinc-950/98 p-0 text-white shadow-none sm:max-w-none">
                <div className="flex h-full flex-col">
                    <div className="border-b border-white/10 px-5 py-5">
                        <DialogTitle className="text-xl font-black tracking-tight text-white">
                            COP17 Navigation
                        </DialogTitle>
                        <DialogDescription className="mt-2 max-w-xs text-sm text-white/60">
                            Move through hotels, tours, shuttle, and account pages without losing your booking context.
                        </DialogDescription>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-6">
                        <div className="space-y-3">
                            {primaryLinks.map((link) => {
                                const active = link.href === "/"
                                    ? pathname === "/"
                                    : link.href === "/#search"
                                        ? pathname.startsWith("/hotels") || pathname === "/"
                                        : pathname === link.href;

                                return (
                                    <DialogClose asChild key={link.href}>
                                        <SearchAwareLink
                                            href={link.href}
                                            className={cn(
                                                "flex min-h-14 items-center justify-between rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.18em] transition-all",
                                                active
                                                    ? "border-blue-500/50 bg-blue-600/15 text-white"
                                                    : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white"
                                            )}
                                        >
                                            <span>{link.label}</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </SearchAwareLink>
                                    </DialogClose>
                                );
                            })}

                            <DialogClose asChild>
                                <a
                                    href="https://unccdcop17.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white/80 transition-all hover:bg-white/[0.08] hover:text-white"
                                >
                                    <span>About COP17</span>
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            </DialogClose>
                        </div>

                        <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
                            {showUserContent ? (
                                <>
                                    <DialogClose asChild>
                                        <Link href="/my-bookings" className="flex min-h-14 items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-950">
                                            <span>My Bookings</span>
                                            <CalendarDays className="h-4 w-4" />
                                        </Link>
                                    </DialogClose>
                                    {isAdminUser && (
                                        <DialogClose asChild>
                                            <Link href="/admin" className="flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white/80 transition-all hover:bg-white/[0.08] hover:text-white">
                                                <span>Dashboard</span>
                                                <LayoutDashboard className="h-4 w-4" />
                                            </Link>
                                        </DialogClose>
                                    )}
                                </>
                            ) : !isAuthPage ? (
                                <>
                                    <DialogClose asChild>
                                        <Link href="/login" className="flex min-h-14 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white/80 transition-all hover:bg-white/[0.08] hover:text-white">
                                            <span>Sign In</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </DialogClose>
                                    <DialogClose asChild>
                                        <SearchAwareLink href="/#search" className="flex min-h-14 items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-950">
                                            <span>Book Stay</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </SearchAwareLink>
                                    </DialogClose>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function NavLink({
    href,
    active,
    external,
    preserveSearch,
    children,
}: {
    href: string,
    active?: boolean,
    external?: boolean,
    preserveSearch?: boolean,
    children: React.ReactNode
}) {
    const className = cn(
        "text-[12px] font-bold uppercase tracking-wider transition-all relative pb-1 group flex items-center h-full",
        active ? "text-white" : "text-white/70 hover:text-white"
    );


    const inner = (
        <>
            {children}
            <span className={cn(
                "absolute bottom-0 left-0 h-[2px] bg-blue-500 transition-all duration-300 rounded-full",
                active ? "w-full" : "w-0 group-hover:w-full"
            )} />
        </>
    );

    if (external) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{inner}</a>;
    }

    if (preserveSearch) {
        return <SearchAwareLink href={href} className={className}>{inner}</SearchAwareLink>;
    }

    return <Link href={href} className={className}>{inner}</Link>;
}
