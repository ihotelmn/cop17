import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Hotel, BookOpen, LogOut, Settings, Users, Activity, Calendar, Users2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Verify Session
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        redirect("/login");
    }

    // Verify Role
    let { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    // Fallback: If profile is not found with standard client (RLS/latency issue), try admin client
    if (!profile) {
        // console.log("Profile not found in AdminLayout, trying admin client...");
        const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
        try {
            const adminClient = getSupabaseAdmin();
            const { data: adminProfile } = await adminClient
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
            profile = adminProfile;
        } catch (error) {
            console.error("Admin client fallback failed:", error);
        }
    }

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin" && profile.role !== "liaison")) {
        redirect("/"); // unauthorized
    }

    const isSuperAdmin = profile.role === "super_admin";
    const isLiaison = profile.role === "liaison";

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hidden md:block fixed inset-y-0 z-40">
                <div className="flex h-16 items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
                    <Image
                        src="/images/cop17-logo-horizontal.png"
                        alt="COP17 Mongolia"
                        width={140}
                        height={40}
                        className="h-8 w-auto object-contain dark:invert"
                    />
                </div>
                <nav className="p-4 space-y-1">
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Overview
                    </Link>
                    <Link
                        href="/admin/inventory"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                        <Calendar className="h-4 w-4" />
                        Inventory
                    </Link>
                    <Link
                        href="/admin/bookings"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                        <BookOpen className="h-4 w-4" />
                        Bookings
                    </Link>
                    <Link
                        href="/admin/hotels"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                        <Hotel className="h-4 w-4" />
                        Hotels
                    </Link>

                    {(isSuperAdmin || profile.role === "admin" || isLiaison) && (
                        <Link
                            href="/admin/group-requests"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                            <Users2 className="h-4 w-4" />
                            Group Requests
                        </Link>
                    )}

                    {isSuperAdmin && (
                        <>
                            <Link
                                href="/admin/reports"
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            >
                                <BookOpen className="h-4 w-4" />
                                Reports
                            </Link>
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            >
                                <Users className="h-4 w-4" />
                                Users (Admin)
                            </Link>
                            <Link
                                href="/admin/audit-logs"
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            >
                                <Activity className="h-4 w-4" />
                                Audit Logs
                            </Link>
                            <Link
                                href="/admin/settings"
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </Link>
                        </>
                    )}
                </nav>
                <div className="absolute bottom-4 left-4 right-4">
                    <form action={async () => {
                        "use server";
                        const sb = await createClient();
                        await sb.auth.signOut();
                        redirect("/login");
                    }}>
                        <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
