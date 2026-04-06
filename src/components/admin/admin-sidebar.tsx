"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import {
    LayoutDashboard,
    Hotel,
    BookOpen,
    LogOut,
    Settings,
    Users,
    Activity,
    Calendar,
    Users2,
    Menu,
    X
} from "lucide-react";

interface AdminSidebarProps {
    userRole: string;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    roles: string[]; // which roles can see this
}

const allNavItems: NavItem[] = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, roles: ["super_admin", "admin", "liaison"] },
    { href: "/admin/inventory", label: "Inventory", icon: <Calendar className="h-4 w-4" />, roles: ["super_admin", "admin", "liaison"] },
    { href: "/admin/bookings", label: "Bookings", icon: <BookOpen className="h-4 w-4" />, roles: ["super_admin", "admin", "liaison"] },
    { href: "/admin/hotels", label: "Hotels", icon: <Hotel className="h-4 w-4" />, roles: ["super_admin", "admin", "liaison"] },
    { href: "/admin/group-requests", label: "Group Requests", icon: <Users2 className="h-4 w-4" />, roles: ["super_admin", "admin", "liaison"] },
    { href: "/admin/reports", label: "Reports", icon: <BookOpen className="h-4 w-4" />, roles: ["super_admin"] },
    { href: "/admin/users", label: "Users (Admin)", icon: <Users className="h-4 w-4" />, roles: ["super_admin"] },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: <Activity className="h-4 w-4" />, roles: ["super_admin"] },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" />, roles: ["super_admin"] },
];

export function AdminSidebar({ userRole }: AdminSidebarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const visibleItems = allNavItems.filter(item => item.roles.includes(userRole));

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    const sidebarContent = (
        <>
            <div className="flex h-16 items-center px-6 border-b border-zinc-200">
                <Image
                    src="/images/cop17-logo-horizontal.png"
                    alt="COP17 Mongolia"
                    width={140}
                    height={40}
                    className="h-8 w-auto object-contain"
                />
            </div>
            <nav className="p-4 space-y-1 flex-1">
                {visibleItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                            isActive(item.href)
                                ? "bg-blue-50 text-blue-700 shadow-sm"
                                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        )}
                    >
                        <span className={cn(
                            "transition-colors",
                            isActive(item.href) ? "text-blue-600" : ""
                        )}>
                            {item.icon}
                        </span>
                        {item.label}
                        {isActive(item.href) && (
                            <span className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        )}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t border-zinc-100">
                <form action={signOutAction}>
                    <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </form>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-20 left-4 z-50 md:hidden bg-white border border-zinc-200 rounded-xl p-2.5 shadow-lg"
                aria-label="Open admin menu"
            >
                <Menu className="h-5 w-5 text-zinc-700" />
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-zinc-200 flex flex-col transform transition-transform duration-300 md:hidden",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-zinc-100"
                    aria-label="Close admin menu"
                >
                    <X className="h-5 w-5 text-zinc-500" />
                </button>
                {sidebarContent}
            </aside>

            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-zinc-200 bg-white hidden md:flex md:flex-col fixed top-16 bottom-0 left-0 z-40">
                {sidebarContent}
            </aside>


        </>
    );
}
