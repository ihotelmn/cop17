import { createClient } from "@supabase/supabase-js";
import { normalizeEnvValue } from "@/lib/env";

// Note: access to SERVICE_ROLE_KEY is critical for admin operations.
// This client should ONLY be used in secure server-side contexts (Server Actions/API Routes).
export const getSupabaseAdmin = () => {
    const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) || normalizeEnvValue(process.env.SUPABASE_URL);
    const serviceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY) || normalizeEnvValue(process.env.SERVICE_ROLE_KEY);

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(`Supabase Admin keys are missing! (URL: ${!!supabaseUrl}, Key: ${!!serviceRoleKey}). Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.`);
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
