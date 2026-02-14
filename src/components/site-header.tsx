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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, logout } = useAuth();

    return (
        <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", isHome ? "bg-transparent backdrop-blur-sm border-b border-white/10" : "bg-black/80 backdrop-blur-md border-b border-white/10")}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/images/cop17-logo-horizontal.png"
                        alt="COP17 Logo"
                        width={40}
                        height={40}
                        className="h-8 w-auto object-contain brightness-0 invert"
                    />
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-6">
                    <NavLink href="/" active={pathname === "/"}>Home</NavLink>
                    <NavLink href="/hotels" active={pathname.startsWith("/hotels")}>Hotels</NavLink>
                    <NavLink href="#">Tours & Experiences</NavLink>
                    <NavLink href="#">Airport Shuttle</NavLink>
                    <NavLink href="#">Support</NavLink>
                    <NavLink href="https://unccdcop17.org" external>About COP17</NavLink>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <div className="hidden md:flex items-center gap-4">
                                <NavLink href="/my-bookings" active={pathname === "/my-bookings"}>My Bookings</NavLink>
                                {(user.role === 'admin' || user.role === 'super_admin') && (
                                    <Button asChild variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                                        <Link href="/admin">Dashboard</Link>
                                    </Button>
                                )}
                            </div>

                            {(user.role === 'admin' || user.role === 'super_admin') && (
                                <NotificationBell userId={user.id} />
                            )}
                            <UserNav />
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                                Sign In
                            </Link>
                            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                                <Link href="/hotels">Book Now</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

function NavLink({ href, active, external, children }: { href: string, active?: boolean, external?: boolean, children: React.ReactNode }) {
    const className = cn(
        "text-sm font-medium transition-colors hover:text-white",
        active ? "text-white" : "text-white/70"
    );

    if (external) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
    }

    return <Link href={href} className={className}>{children}</Link>;
}
