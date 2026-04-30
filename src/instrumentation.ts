/**
 * Next.js instrumentation hook — runs once when the server boots.
 * Used to validate environment configuration so a misconfigured deploy
 * fails fast at boot instead of silently serving broken pages.
 *
 * Register: enabled automatically via `experimental.instrumentationHook`
 * in newer Next.js, or via `next.config.ts` if needed.
 */

type RequiredEnv = {
    name: string;
    description: string;
    productionOnly?: boolean;
};

const REQUIRED: RequiredEnv[] = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", description: "Supabase project URL" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Supabase anon key" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key" },
    { name: "ENCRYPTION_KEY", description: "AES-GCM 32-byte hex key for PII" },
    { name: "NEXT_PUBLIC_APP_URL", description: "Canonical site URL" },
    { name: "RESEND_API_KEY", description: "Resend transactional email key", productionOnly: true },
    { name: "BOOKING_ACCESS_TOKEN_SECRET", description: "Guest booking access HMAC secret", productionOnly: true },
];

const LIVE_GOLOMT_REQUIRED: RequiredEnv[] = [
    { name: "GOLOMT_MERCHANT_ID", description: "Golomt merchant id" },
    { name: "GOLOMT_SECRET_TOKEN", description: "Golomt API secret" },
    { name: "GOLOMT_CALLBACK_SECRET", description: "HMAC secret for payment callback signatures" },
    { name: "GOLOMT_CHECKOUT_URL", description: "Golomt hosted checkout URL" },
];

function isProduction(): boolean {
    return process.env.NODE_ENV === "production";
}

function validateEncryptionKey(value: string | undefined): string | null {
    if (!value) return "ENCRYPTION_KEY is not set";
    if (!/^[0-9a-fA-F]{32,}$/.test(value)) {
        return "ENCRYPTION_KEY must be a hex string of at least 32 characters (16 bytes)";
    }
    return null;
}

export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;

    const errors: string[] = [];

    for (const spec of REQUIRED) {
        if (spec.productionOnly && !isProduction()) continue;
        const v = process.env[spec.name];
        if (!v || v.trim() === "") {
            errors.push(`Missing env ${spec.name} (${spec.description})`);
        }
    }

    const keyError = validateEncryptionKey(process.env.ENCRYPTION_KEY);
    if (keyError) errors.push(keyError);

    // In production, Golomt must be configured in live mode with all secrets.
    if (isProduction()) {
        const mode = (process.env.GOLOMT_MODE || "").toLowerCase();
        if (mode !== "live") {
            errors.push(
                "GOLOMT_MODE must be 'live' in production (got " + (mode || "unset") + ")"
            );
        }
        for (const spec of LIVE_GOLOMT_REQUIRED) {
            const v = process.env[spec.name];
            if (!v || v.startsWith("YOUR_") || v.startsWith("TEST_")) {
                errors.push(
                    `Missing/placeholder Golomt env ${spec.name} (${spec.description})`
                );
            }
        }
    }

    if (errors.length > 0) {
        const banner = [
            "=".repeat(72),
            "cop17-platform: environment validation failed",
            ...errors.map((e) => "  • " + e),
            "=".repeat(72),
        ].join("\n");
        // Log loudly and abort. Do NOT serve traffic with an incomplete env.
        console.error(banner);
        throw new Error("Environment validation failed. See logs above.");
    }
}
