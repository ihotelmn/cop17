"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/admin/notification-bell";
import { UserNav } from "@/components/user-nav";

export function SiteHeader() {
    const pathname = usePathname();
    const isHome = pathname === "/";
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, logout } = useAuth();

    // Hide auth section on login/signup pages to avoid "ghost session" confusion
    const showUserContent = user && !isAuthPage;


    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
            isHome
                ? "bg-black/20 backdrop-blur-md border-b border-white/5"
                : "bg-zinc-950/90 backdrop-blur-xl border-b border-white/10 shadow-2xl"
        )}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95">
                    <div className="relative">
                        <Image
                            src="/images/cop17-logo-horizontal.png"
                            alt="COP17 Logo"
                            width={120}
                            height={40}
                            className="h-9 w-auto object-contain brightness-0 invert drop-shadow-md"
                        />
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden lg:flex items-center gap-8">
                    <NavLink href="/" active={pathname === "/"}>Home</NavLink>
                    <NavLink href="/#search" active={pathname.startsWith("/hotels")}>Hotels</NavLink>
                    <NavLink href="/tours" active={pathname === "/tours"}>Tours</NavLink>
                    <NavLink href="/shuttle" active={pathname === "/shuttle"}>Shuttle</NavLink>
                    <NavLink href="/support" active={pathname === "/support"}>Support</NavLink>
                    <NavLink href="https://unccdcop17.org" external>About COP17</NavLink>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-6">
                    {showUserContent ? (
                        <>
                            <div className="hidden md:flex items-center gap-6">
                                <NavLink href="/my-bookings" active={pathname === "/my-bookings"}>My Bookings</NavLink>
                                {(user!.role === 'admin' || user!.role === 'super_admin') && (
                                    <Button asChild variant="ghost" className="text-[12px] font-bold uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-4">
                                        <Link href="/admin">Dashboard</Link>
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {(user!.role === 'admin' || user!.role === 'super_admin') && (
                                    <NotificationBell userId={user!.id} />
                                )}
                                <UserNav />
                            </div>
                        </>
                    ) : !isAuthPage && (
                        <div className="flex items-center gap-6">
                            <Link href="/login" className="text-[12px] font-bold uppercase tracking-wider text-white/60 hover:text-white transition-all">
                                Sign In
                            </Link>
                            <Button asChild className="bg-white text-black hover:bg-zinc-100 rounded-2xl px-10 h-11 text-[12px] font-bold uppercase tracking-wider shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95">
                                <Link href="/#search">Book Stay</Link>
                            </Button>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}

function NavLink({ href, active, external, children }: { href: string, active?: boolean, external?: boolean, children: React.ReactNode }) {
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

    return <Link href={href} className={className}>{inner}</Link>;
}
