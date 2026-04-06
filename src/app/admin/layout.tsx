import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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

    return (
        <div className="flex min-h-screen bg-zinc-50">

            <AdminSidebar userRole={profile.role} />

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
