"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type UserRole = "super_admin" | "admin" | "liaison" | "vip" | "guest";

interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}

/**
 * Verify that the current user is authenticated.
 * Returns the user profile or throws an error.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized: No active session");
    }

    // Get profile with role
    const adminClient = getSupabaseAdmin();
    const { data: profile } = await adminClient
        .from("profiles")
        .select("role, email, full_name")
        .eq("id", user.id)
        .single();

    const role = (profile?.role as UserRole) || "guest";

    return {
        id: user.id,
        email: user.email || profile?.email || "",
        role,
    };
}

/**
 * Verify that the current user has one of the required roles.
 * Returns the user profile or throws an error.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
    const user = await requireAuth();

    if (!allowedRoles.includes(user.role)) {
        throw new Error(
            `Forbidden: Role '${user.role}' is not authorized. Required: ${allowedRoles.join(", ")}`
        );
    }

    return user;
}
