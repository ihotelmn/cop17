import { createClient } from "@supabase/supabase-js";

// Note: access to SERVICE_ROLE_KEY is critical for admin operations.
// This client should ONLY be used in secure server-side contexts (Server Actions/API Routes).
export const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        // Find a way to handle this more gracefully if possible, or throw a descriptive error
        // throwing here is fine as long as we don't call this function at the top level
        throw new Error("Supabase Admin keys are missing! Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
