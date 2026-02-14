"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(["super_admin", "admin", "guest"]).default("admin"),
    organization: z.string().optional(),
});

export type UserProfile = {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    organization: string | null;
    created_at: string;
};

// Log Audit Event Helper
async function logAction(userId: string, action: string, details: any) {
    try {
        const adminClient = getSupabaseAdmin();

        // Extract some common fields from details if available
        const tableName = details.table || details.tableName || "unknown";
        const recordId = details.targetUserId || details.recordId || details.id || null;

        // Remove redundant fields from details to save space
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

export async function getUsers() {
    const supabase = await createClient();
    const adminClient = getSupabaseAdmin();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // SECURITY CHECK: Verify user is super_admin before letting them list all users
    const { data: requesterProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (requesterProfile?.role !== "super_admin") {
        console.error(`[Security Alert] User ${user.id} tried to list users but is not super_admin`);
        return [];
    }

    const { data: profiles, error } = await adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching users (Admin Client):", error);
        return [];
    }

    console.log(`[getUsers] Found ${profiles?.length || 0} user profiles.`);
    return profiles as UserProfile[];
}

export async function createUser(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) return { error: "Unauthorized" };

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
        email_confirm: true, // Auto-confirm for admin-created users
        user_metadata: { full_name: fullName, role: role }
    });

    if (authError) {
        console.error("Auth Creation Error:", authError);
        return { error: authError.message };
    }

    if (!authUser.user) return { error: "Failed to create user object." };

    // 2. Profile creation is usually handled by a Database Trigger on auth.users insert
    // But if we don't have that trigger set up, we must manually insert into profiles
    // Let's manually insert to be safe, using upsert to avoid conflict if trigger exists
    const { error: profileError } = await getSupabaseAdmin()
        .from("profiles")
        .upsert({
            id: authUser.user.id,
            email,
            full_name: fullName,
            role,
            organization
        });

    if (profileError) {
        console.error("Profile Creation Error:", profileError);
        // Clean up auth user if profile fails? Or just return warning
        return { error: "User created but profile sync failed." };
    }

    await logAction(currentUser.id, "CREATE_USER", { targetUserId: authUser.user.id, role });

    revalidatePath("/admin/users");
    redirect("/admin/users");
}

export async function deleteUser(userId: string) {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) return { error: "Unauthorized" };

    // 1. Delete from Auth (This should cascade to profiles if configured with ON DELETE CASCADE)
    // We use Admin client for this
    const { error } = await getSupabaseAdmin().auth.admin.deleteUser(userId);

    if (error) {
        console.error("Delete User Error:", error);
        return { error: "Failed to delete user." };
    }

    await logAction(currentUser.id, "DELETE_USER", { targetUserId: userId });

    revalidatePath("/admin/users");
}
