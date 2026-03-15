import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/auth-helpers";

export type GroupRequestAdminRole = Extract<UserRole, "super_admin" | "admin" | "liaison">;

const GROUP_REQUEST_SELECT = `
    *,
    assigned_liaison:profiles(id, full_name, email)
`;

export async function requireGroupRequestAccess() {
    const supabase = await createClient();
    const adminSupabase = getSupabaseAdmin();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data: profile } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const role = profile?.role as GroupRequestAdminRole | undefined;

    if (!role || !["super_admin", "admin", "liaison"].includes(role)) {
        throw new Error("Forbidden");
    }

    return {
        userId: user.id,
        role,
        adminSupabase,
    };
}

export async function getAccessibleGroupRequests() {
    const access = await requireGroupRequestAccess();

    let query = access.adminSupabase
        .from("group_requests")
        .select(GROUP_REQUEST_SELECT)
        .order("created_at", { ascending: false });

    if (access.role === "liaison") {
        query = query.eq("assigned_liaison_id", access.userId);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return {
        access,
        requests: data || [],
    };
}

export async function getAccessibleGroupRequestById(requestId: string) {
    const access = await requireGroupRequestAccess();

    let query = access.adminSupabase
        .from("group_requests")
        .select(GROUP_REQUEST_SELECT)
        .eq("id", requestId);

    if (access.role === "liaison") {
        query = query.eq("assigned_liaison_id", access.userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        throw error;
    }

    return {
        access,
        request: data,
    };
}

export function canManageGroupAssignments(role: GroupRequestAdminRole) {
    return role === "admin" || role === "super_admin";
}
