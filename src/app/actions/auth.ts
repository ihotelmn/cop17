"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AuthState } from "@/types/auth";
import {
    ActionRateLimitError,
    buildActionRateLimitKey,
    enforceActionRateLimitSafely,
    getClientIpFromHeaders,
} from "@/lib/action-rate-limit";
import { getPublicAppUrl } from "@/lib/site-config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2).optional(),
});

function getRateLimitErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof ActionRateLimitError) {
        const retryAfterMinutes = Math.max(1, Math.ceil(error.retryAfterSeconds / 60));
        return `${error.message} Retry in about ${retryAfterMinutes} minute${retryAfterMinutes > 1 ? "s" : ""}.`;
    }

    return fallbackMessage;
}

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
    const normalizedEmail = email.toLowerCase().trim();

    try {
        const requestHeaders = await headers();
        const clientIp = getClientIpFromHeaders(requestHeaders);
        const identityKey = buildActionRateLimitKey(clientIp, normalizedEmail);

        await enforceActionRateLimitSafely({
            scope: "auth:login:network:v2",
            key: clientIp,
            maxHits: 60,
            windowMs: 10 * 60 * 1000,
            message: "Too many sign-in attempts from this network.",
        }, "auth:login:network:v2");

        await enforceActionRateLimitSafely({
            scope: "auth:login:identity:v2",
            key: identityKey,
            maxHits: 12,
            windowMs: 10 * 60 * 1000,
            message: "Too many recent sign-in attempts for this account.",
        }, "auth:login:identity:v2");
    } catch (error) {
        return { error: getRateLimitErrorMessage(error, "Too many sign-in attempts. Please try again later.") };
    }

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

    if (user) {
        let { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        // Fallback: If profile is not found (which shouldn't happen but might due to RLS lag), try fetching with Admin client
        if (!profile) {
            const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
            const adminClient = getSupabaseAdmin();
            const { data: adminProfile } = await adminClient
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();
            profile = adminProfile;
        }


        if (profile) {
            revalidatePath("/", "layout");
            if (profile.role === "admin" || profile.role === "super_admin") {
                redirect("/admin");
            } else {
                redirect("/");
            }
        }
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signupAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const supabase = await createClient();

    const validatedFields = authSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        fullName: formData.get("fullName"),
    });

    if (!validatedFields.success) {
        return { error: "Invalid input. Password must be at least 6 chars." };
    }

    const { email, password, fullName } = validatedFields.data;
    const normalizedEmail = email.toLowerCase().trim();

    try {
        const requestHeaders = await headers();
        const clientIp = getClientIpFromHeaders(requestHeaders);
        const identityKey = buildActionRateLimitKey(clientIp, normalizedEmail);

        await enforceActionRateLimitSafely({
            scope: "auth:signup:network:v2",
            key: clientIp,
            maxHits: 20,
            windowMs: 30 * 60 * 1000,
            message: "Too many sign-up attempts from this network.",
        }, "auth:signup:network:v2");

        await enforceActionRateLimitSafely({
            scope: "auth:signup:identity:v2",
            key: identityKey,
            maxHits: 6,
            windowMs: 30 * 60 * 1000,
            message: "Too many recent sign-up attempts for this account.",
        }, "auth:signup:identity:v2");
    } catch (error) {
        return { error: getRateLimitErrorMessage(error, "Too many sign-up attempts. Please try again later.") };
    }

    const baseUrl = getPublicAppUrl();

    console.log("Starting signup flow. Redirecting to:", `${baseUrl}/auth/callback`);

    const adminSupabase = getSupabaseAdmin();
    const { data: linkData, error } = await adminSupabase.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: "guest",
            },
            redirectTo: `${baseUrl}/auth/callback`,
        },
    });

    if (error) {
        return { error: error.message };
    }

    const verificationLink = linkData?.properties?.action_link;
    if (verificationLink) {
        await sendVerificationEmail(email, fullName || "Guest", verificationLink).catch((emailErr) => {
            console.error("Failed to send verification email:", emailErr);
        });
    }

    revalidatePath("/", "layout");

    return {
        success: true,
        message: "Account created! Please check your email to verify your account."
    };
}

export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login");
}

const passwordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export async function updatePasswordAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const supabase = await createClient();

    const validatedFields = passwordSchema.safeParse({
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.password?.[0] || validatedFields.error.flatten().fieldErrors.confirmPassword?.[0] };
    }

    const { password } = validatedFields.data;

    const { error } = await supabase.auth.updateUser({
        password: password
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true, message: "Password updated successfully!" };
}

export async function requestPasswordResetAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const email = formData.get("email") as string;
    if (!email) return { error: "Email is required" };

    const baseUrl = getPublicAppUrl();
    const adminSupabase = getSupabaseAdmin();

    try {
        const { data: linkData, error } = await adminSupabase.auth.admin.generateLink({
            type: "recovery",
            email: email,
            options: {
                redirectTo: `${baseUrl}/auth/callback?next=/settings/profile`,
            },
        });

        if (error) {
            // Security best practice: don't reveal if user exists
            return { success: true, message: "If an account exists, a reset link has been sent." };
        }

        const resetLink = linkData?.properties?.action_link;
        if (resetLink) {
            // Try to find the user's name
            const { data: profile } = await adminSupabase
                .from("profiles")
                .select("full_name")
                .eq("email", email)
                .maybeSingle();

            await sendPasswordResetEmail(email, profile?.full_name || "Guest", resetLink).catch((e) => {
                console.error("Failed to send reset email:", e);
            });
        }

        return { success: true, message: "If an account exists, a reset link has been sent." };
    } catch (e) {
        console.error("Reset Request Error:", e);
        return { error: "An unexpected error occurred." };
    }
}
