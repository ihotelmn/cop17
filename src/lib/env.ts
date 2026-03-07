export function normalizeEnvValue(value?: string | null): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim().replace(/^['"]|['"]$/g, "");

    return normalized || undefined;
}

export function requireEnv(name: string): string {
    const value = normalizeEnvValue(process.env[name]);

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

export function requirePublicSupabaseEnv() {
    const url = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const anonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!url) {
        throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
    }

    if (!anonKey) {
        throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    return {
        url,
        anonKey,
    };
}
