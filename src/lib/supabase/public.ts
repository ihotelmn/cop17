import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requirePublicSupabaseEnv } from "@/lib/env";

export function getSupabasePublic() {
    const { url, anonKey } = requirePublicSupabaseEnv();

    return createClient(url, anonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
