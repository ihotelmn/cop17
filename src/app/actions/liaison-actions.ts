"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function assignLiaisonAction(requestId: string, liaisonId: string) {
    const adminSupabase = getSupabaseAdmin();

    try {
        const { error } = await adminSupabase
            .from("group_requests")
            .update({
                assigned_liaison_id: liaisonId,
                status: 'approved' // Automatically approve when assigned
            })
            .eq("id", requestId);

        if (error) throw error;

        // Notify the liaison
        await adminSupabase.from("notifications").insert({
            user_id: liaisonId,
            title: "New Assignment",
            message: `You have been assigned to a new group request.`,
            type: "assignment",
            link: `/admin/group-requests`
        });

        revalidatePath("/admin/group-requests");
        return { success: true };
    } catch (error) {
        console.error("Assign Liaison Error:", error);
        return { error: "Failed to assign liaison" };
    }
}

export async function updateGroupRequestStatusAction(requestId: string, status: string, notes?: string) {
    const adminSupabase = getSupabaseAdmin();

    try {
        const { error } = await adminSupabase
            .from("group_requests")
            .update({ status, notes })
            .eq("id", requestId);

        if (error) throw error;

        revalidatePath("/admin/group-requests");
        return { success: true };
    } catch (error) {
        console.error("Update Request Status Error:", error);
        return { error: "Failed to update status" };
    }
}

export async function getLiaisonsAction() {
    const adminSupabase = getSupabaseAdmin();

    const { data, error } = await adminSupabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["admin", "super_admin", "liaison"]);

    if (error) {
        console.error("Get Liaisons Error:", error);
        return [];
    }

    return data;
}
