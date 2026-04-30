/**
 * Next.js instrumentation hook — runs once when the server boots.
 *
 * Two tiers of validation:
 *
 *   HARD (throws, blocks boot): Things that would cause silent data
 *     corruption or 100% downtime if missing/wrong. Currently:
 *       - Supabase URL + anon + service-role keys
 *       - ENCRYPTION_KEY (and its hex format)
 *       - NEXT_PUBLIC_APP_URL
 *
 *   SOFT (warns to logs): Things whose absence the runtime guards against
 *     anyway, so a misconfigured deploy stays functional but visibly
 *     degraded:
 *       - BOOKING_ACCESS_TOKEN_SECRET — guest-booking-access.ts uses a dev
 *         fallback in non-prod and throws at request time in prod, so the
 *         site still serves browse pages.
 *       - GOLOMT_MODE / Golomt creds — booking.ts refuses pay_now unless
 *         live mode + creds. Pre-book remains available.
 *
 * Hard tier is non-negotiable. Soft tier prints a banner so it's loud in the
 * Vercel logs without taking down the entire site while contracts/keys are
 * being arranged.
 */

type RequiredEnv = {
    name: string;
    description: string;
    productionOnly?: boolean;
};

const HARD_REQUIRED: RequiredEnv[] = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", description: "Supabase project URL" },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Supabase anon key" },
    { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key" },
    { name: "ENCRYPTION_KEY", description: "AES-GCM 32-byte hex key for PII" },
    { name: "NEXT_PUBLIC_APP_URL", description: "Canonical site URL" },
];

const SOFT_REQUIRED: RequiredEnv[] = [
    { name: "RESEND_API_KEY", description: "Resend transactional email key", productionOnly: true },
    { name: "BOOKING_ACCESS_TOKEN_SECRET", description: "Guest booking access HMAC secret", productionOnly: true },
];

const LIVE_GOLOMT_SOFT: RequiredEnv[] = [
    { name: "GOLOMT_MODE", description: "Set to 'live' once Golomt contract is signed" },
    { name: "GOLOMT_MERCHANT_ID", description: "Golomt merchant id" },
    { name: "GOLOMT_SECRET_TOKEN", description: "Golomt API secret" },
    { name: "GOLOMT_CALLBACK_SECRET", description: "HMAC secret for payment callback signatures" },
    { name: "GOLOMT_CHECKOUT_URL", description: "Golomt hosted checkout URL" },
];

function isProduction(): boolean {
    return process.env.NODE_ENV === "production";
}

function isMissing(value: string | undefined): boolean {
    return !value || value.trim() === "" || value.startsWith("YOUR_") || value.startsWith("TEST_");
}

function validateEncryptionKey(value: string | undefined): string | null {
    if (!value) return "ENCRYPTION_KEY is not set";
    if (!/^[0-9a-fA-F]{32,}$/.test(value)) {
        return "ENCRYPTION_KEY must be a hex string of at least 32 characters (16 bytes)";
    }
    return null;
}

function banner(title: string, lines: string[]): string {
    return ["=".repeat(72), `cop17-platform: ${title}`, ...lines.map((l) => "  • " + l), "=".repeat(72)].join("\n");
}

export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;

    // ---- HARD checks (boot-fail) ----
    const hardErrors: string[] = [];

    for (const spec of HARD_REQUIRED) {
        if (isMissing(process.env[spec.name])) {
            hardErrors.push(`Missing env ${spec.name} (${spec.description})`);
        }
    }

    const keyError = validateEncryptionKey(process.env.ENCRYPTION_KEY);
    if (keyError) hardErrors.push(keyError);

    if (hardErrors.length > 0) {
        console.error(banner("environment validation failed (hard)", hardErrors));
        throw new Error("Environment validation failed. See logs above.");
    }

    // ---- SOFT checks (warn only) ----
    const softWarnings: string[] = [];

    for (const spec of SOFT_REQUIRED) {
        if (spec.productionOnly && !isProduction()) continue;
        if (isMissing(process.env[spec.name])) {
            softWarnings.push(`Missing env ${spec.name} (${spec.description})`);
        }
    }

    if (isProduction()) {
        const mode = (process.env.GOLOMT_MODE || "").toLowerCase();
        if (mode !== "live") {
            softWarnings.push(
                `GOLOMT_MODE is '${mode || "unset"}' — online card payments are disabled (Pre-book is still available).`
            );
        }
        for (const spec of LIVE_GOLOMT_SOFT) {
            if (isMissing(process.env[spec.name])) {
                softWarnings.push(`Missing/placeholder ${spec.name} (${spec.description})`);
            }
        }
    }

    if (softWarnings.length > 0) {
        console.warn(banner("environment warnings (soft) — site is up, some features degraded", softWarnings));
    }
}
