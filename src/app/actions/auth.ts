"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2).optional(),
});

export type AuthState = {
    error?: string;
    success?: boolean;
    message?: string;
};

export async function loginAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const supabase = await createClient();

    const validatedFields = authSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validatedFields.success) {
        return { error: "Invalid email or password format." };
    }

    const { email, password } = validatedFields.data;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("Login failed:", error.message);
        return { error: error.message };
    }

    // Check Role for Redirect
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Login successful. User:", user?.id);

    if (user) {
        let { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        // Fallback: If profile is not found (which shouldn't happen but might due to RLS lag), try fetching with Admin client
        if (!profile) {
            console.log("Profile not found with standard client, trying admin client...");
            const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
            const adminClient = getSupabaseAdmin();
            const { data: adminProfile } = await adminClient
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
            profile = adminProfile;
        }

        console.log("User Profile Role:", profile?.role);

        if (profile) {
            if (profile.role === "admin" || profile.role === "super_admin") {
                redirect("/admin");
            } else {
                redirect("/");
            }
        }
    }

    redirect("/");
}

export async function signupAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const supabase = await createClient();
    const origin = (await headers()).get("origin");

    const validatedFields = authSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        fullName: formData.get("fullName"),
    });

    if (!validatedFields.success) {
        return { error: "Invalid input. Password must be at least 6 chars." };
    }

    const { email, password, fullName } = validatedFields.data;

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: "guest", // Explicitly set guest metadata for trigger
            },
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        return { error: error.message };
    }

    return {
        success: true,
        message: "Account created! Please check your email to verify your account."
    };
}
