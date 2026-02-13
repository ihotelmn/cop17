import { createClient } from "@supabase/supabase-js";

// Note: access to SERVICE_ROLE_KEY is critical for admin operations.
// This client should ONLY be used in secure server-side contexts (Server Actions/API Routes).
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
