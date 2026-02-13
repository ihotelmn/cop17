import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

    // Only log warning in development to avoid noise in logs if this is expected during some build phases
    if ((!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && process.env.NODE_ENV === "development") {
        console.warn("Supabase keys are missing. Using placeholder values to prevent crash.");
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseKey
    );
}
