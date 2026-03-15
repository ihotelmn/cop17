"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
    canManageGroupAssignments,
    getAccessibleGroupRequestById,
    requireGroupRequestAccess,
} from "@/lib/group-request-access";

export async function assignLiaisonAction(requestId: string, liaisonId: string) {
    try {
        const access = await requireGroupRequestAccess();

        if (!canManageGroupAssignments(access.role)) {
            return { error: "Only admins can assign liaisons." };
        }

        const { request } = await getAccessibleGroupRequestById(requestId);

        if (!request) {
            return { error: "Group request not found." };
        }

        const { error } = await access.adminSupabase
            .from("group_requests")
            .update({
                assigned_liaison_id: liaisonId,
                status: "approved",
            })
            .eq("id", requestId);

        if (error) throw error;

        await access.adminSupabase.from("notifications").insert({
            user_id: liaisonId,
            title: "New Assignment",
            message: "You have been assigned to a new group request.",
            type: "assignment",
            link: `/admin/group-requests/${requestId}`,
        });

        revalidatePath("/admin/group-requests");
        revalidatePath(`/admin/group-requests/${requestId}`);
        return { success: true };
    } catch (error) {
        console.error("Assign Liaison Error:", error);
        return { error: "Failed to assign liaison" };
    }
}

export async function updateGroupRequestStatusAction(requestId: string, status: string, notes?: string) {
    try {
        const { access, request } = await getAccessibleGroupRequestById(requestId);

        if (!request) {
            return { error: "Group request not found." };
        }

        const { error } = await access.adminSupabase
            .from("group_requests")
            .update({ status, notes })
            .eq("id", requestId);

        if (error) throw error;

        revalidatePath("/admin/group-requests");
        revalidatePath(`/admin/group-requests/${requestId}`);
        return { success: true };
    } catch (error) {
        console.error("Update Request Status Error:", error);
        return { error: "Failed to update status" };
    }
}

export async function rejectGroupRequestAction(requestId: string) {
    const access = await requireGroupRequestAccess();

    if (!canManageGroupAssignments(access.role)) {
        return { error: "Only admins can reject requests." };
    }

    return updateGroupRequestStatusAction(requestId, "rejected");
}

export async function getLiaisonsAction() {
    try {
        const access = await requireGroupRequestAccess();

        if (!canManageGroupAssignments(access.role)) {
            return [];
        }

        const { data, error } = await getSupabaseAdmin()
            .from("profiles")
            .select("id, full_name, email")
            .in("role", ["admin", "super_admin", "liaison"]);

        if (error) {
            console.error("Get Liaisons Error:", error);
            return [];
        }

        return data;
    } catch (error) {
        console.error("Get Liaisons Access Error:", error);
        return [];
    }
}
