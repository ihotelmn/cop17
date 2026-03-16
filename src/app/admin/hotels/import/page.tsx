import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { HotelImportAssistant } from "@/components/admin/hotel-import-assistant";

export default async function HotelImportPage() {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
        redirect("/admin");
    }

    return (
        <div className="space-y-6">
            <div className="max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tight text-white">Import Hotels</h2>
                <p className="mt-2 text-zinc-400">
                    Build hotel drafts faster from pasted spreadsheets, website metadata, and bulk images. The assistant will classify hotel details, room types, prices, and images for review before anything goes live.
                </p>
            </div>

            <HotelImportAssistant />
        </div>
    );
}
