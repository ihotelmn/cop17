"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AuthState } from "@/types/auth";
import {
    ActionRateLimitError,
    enforceActionRateLimit,
    getClientIpFromHeaders,
} from "@/lib/action-rate-limit";

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

    try {
        const requestHeaders = await headers();
        const clientIp = getClientIpFromHeaders(requestHeaders);

        await enforceActionRateLimit({
            scope: "auth:login:ip",
            key: clientIp,
            maxHits: 10,
            windowMs: 10 * 60 * 1000,
            message: "Too many sign-in attempts.",
        });

        await enforceActionRateLimit({
            scope: "auth:login:email",
            key: email.toLowerCase(),
            maxHits: 6,
            windowMs: 10 * 60 * 1000,
            message: "This email has too many recent sign-in attempts.",
        });
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

    try {
        const requestHeaders = await headers();
        const clientIp = getClientIpFromHeaders(requestHeaders);

        await enforceActionRateLimit({
            scope: "auth:signup:ip",
            key: clientIp,
            maxHits: 5,
            windowMs: 30 * 60 * 1000,
            message: "Too many sign-up attempts from this network.",
        });

        await enforceActionRateLimit({
            scope: "auth:signup:email",
            key: email.toLowerCase(),
            maxHits: 3,
            windowMs: 30 * 60 * 1000,
            message: "This email has too many recent sign-up attempts.",
        });
    } catch (error) {
        return { error: getRateLimitErrorMessage(error, "Too many sign-up attempts. Please try again later.") };
    }

    const productionUrl = 'https://cop17.ihotel.mn';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || productionUrl;

    console.log("Starting signup flow. Redirecting to:", `${baseUrl}/auth/callback`);

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: "guest",
            },
            emailRedirectTo: `${baseUrl}/auth/callback`,
        },
    });

    if (error) {
        return { error: error.message };
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

