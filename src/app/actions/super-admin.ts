"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import type { UserProfile } from "@/types/user";

// No re-exports here to avoid Turbopack build errors.
// Import types from @/types/user instead.

const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(["super_admin", "admin", "guest", "liaison", "vip"]).default("admin"),
    organization: z.string().optional(),
});

// Log Audit Event Helper
async function logAction(userId: string, action: string, details: any) {
    try {
        const adminClient = getSupabaseAdmin();
        const tableName = details.table || details.tableName || "unknown";
        const recordId = details.targetUserId || details.recordId || details.id || null;
        const { table, tableName: _, ...cleanDetails } = details;

        await adminClient.from("audit_logs").insert({
            action,
            changed_by: userId,
            table_name: tableName,
            record_id: recordId,
            new_data: cleanDetails
        });
    } catch (error) {
        console.error("Failed to log audit action:", error);
    }
}

export async function getUsers(): Promise<UserProfile[]> {
    try {
        await requireRole(["super_admin"]);
        const adminClient = getSupabaseAdmin();

        const { data: profiles, error } = await adminClient
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return profiles as UserProfile[];
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function createUser(prevState: any, formData: FormData) {
    try {
        const currentUser = await requireRole(["super_admin"]);

        const rawData = {
            email: formData.get("email"),
            password: formData.get("password"),
            fullName: formData.get("fullName"),
            role: formData.get("role"),
            organization: formData.get("organization"),
        };

        const validated = userSchema.safeParse(rawData);
        if (!validated.success) {
            return { error: "Validation Error", fieldErrors: validated.error.flatten().fieldErrors };
        }

        const { email, password, fullName, role, organization } = validated.data;

        // 1. Create User in Supabase Auth
        const { data: authUser, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role: role }
        });

        if (authError) throw authError;
        if (!authUser.user) throw new Error("Failed to create user object");

        // 2. Profile creation (Manual sync for robustness)
        const { error: profileError } = await getSupabaseAdmin()
            .from("profiles")
            .upsert({
                id: authUser.user.id,
                email,
                full_name: fullName,
                role,
                organization
            });

        if (profileError) throw profileError;

        await logAction(currentUser.id, "CREATE_USER", { targetUserId: authUser.user.id, role });

        revalidatePath("/admin/users");
        redirect("/admin/users");
    } catch (error: any) {
        console.error("Create User Error:", error);
        return { error: error.message || "Failed to create user" };
    }
}

export async function deleteUser(userId: string) {
    try {
        const currentUser = await requireRole(["super_admin"]);

        const { error } = await getSupabaseAdmin().auth.admin.deleteUser(userId);
        if (error) throw error;

        await logAction(currentUser.id, "DELETE_USER", { targetUserId: userId });

        revalidatePath("/admin/users");
    } catch (error) {
        console.error("Delete User Error:", error);
        return { error: "Failed to delete user" };
    }
}

export async function updateUserRole(userId: string, role: string) {
    try {
        const currentUser = await requireRole(["super_admin"]);
        const adminClient = getSupabaseAdmin();

        // 1. Update Profile Table
        const { error: profileError } = await adminClient
            .from("profiles")
            .update({ role })
            .eq("id", userId);

        if (profileError) throw profileError;

        // 2. Update Auth Metadata (for session consistency)
        const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: { role }
        });

        if (authError) throw authError;

        // 3. Log Audit
        await logAction(currentUser.id, "UPDATE_USER_ROLE", {
            targetUserId: userId,
            newRole: role
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch (error: any) {
        console.error("Update Role Error:", error);
        return { success: false, error: error.message || "Failed to update role" };
    }
}

