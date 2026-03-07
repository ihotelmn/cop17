import { createBrowserClient } from "@supabase/ssr";
import { requirePublicSupabaseEnv } from "@/lib/env";

export function createClient() {
    const { url: supabaseUrl, anonKey: supabaseKey } = requirePublicSupabaseEnv();

    return createBrowserClient(
        supabaseUrl,
        supabaseKey
    );
}
