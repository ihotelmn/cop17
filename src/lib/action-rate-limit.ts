import { createHash } from "crypto";
import { getPostgresPool } from "@/lib/postgres";

export class ActionRateLimitError extends Error {
    retryAfterSeconds: number;

    constructor(message: string, retryAfterSeconds: number) {
        super(message);
        this.name = "ActionRateLimitError";
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

type ActionRateLimitInput = {
    scope: string;
    key: string | null | undefined;
    maxHits: number;
    windowMs: number;
    message?: string;
};

type ActionRateLimitRow = {
    hit_count: number;
    window_started_at: string;
};

function hashActionRateLimitKey(key: string) {
    return createHash("sha256").update(key).digest("hex");
}

export function getClientIpFromHeaders(requestHeaders: Headers) {
    const forwardedFor = requestHeaders.get("x-forwarded-for");
    if (forwardedFor) {
        const forwardedIp = forwardedFor.split(",")[0]?.trim();
        if (forwardedIp) {
            return forwardedIp;
        }
    }

    return requestHeaders.get("cf-connecting-ip")
        || requestHeaders.get("x-vercel-forwarded-for")
        || requestHeaders.get("x-real-ip")
        || null;
}

export async function enforceActionRateLimit({
    scope,
    key,
    maxHits,
    windowMs,
    message = "Too many attempts. Please wait a moment and try again.",
}: ActionRateLimitInput) {
    if (!key) {
        return;
    }

    const pool = getPostgresPool();
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
    const keyHash = hashActionRateLimitKey(key);

    const result = await pool.query<ActionRateLimitRow>(
        `
            INSERT INTO public.action_rate_limits (
                scope,
                key_hash,
                window_started_at,
                hit_count,
                last_seen_at,
                updated_at
            )
            VALUES ($1, $2, NOW(), 1, NOW(), NOW())
            ON CONFLICT (scope, key_hash)
            DO UPDATE SET
                hit_count = CASE
                    WHEN public.action_rate_limits.window_started_at <= NOW() - ($3 * interval '1 second') THEN 1
                    ELSE public.action_rate_limits.hit_count + 1
                END,
                window_started_at = CASE
                    WHEN public.action_rate_limits.window_started_at <= NOW() - ($3 * interval '1 second') THEN NOW()
                    ELSE public.action_rate_limits.window_started_at
                END,
                last_seen_at = NOW(),
                updated_at = NOW()
            RETURNING
                hit_count,
                window_started_at::text
        `,
        [scope, keyHash, windowSeconds]
    );

    const row = result.rows[0];
    if (!row) {
        return;
    }

    if (row.hit_count > maxHits) {
        const windowStartedAt = new Date(row.window_started_at);
        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((windowStartedAt.getTime() + windowMs - Date.now()) / 1000)
        );

        throw new ActionRateLimitError(message, retryAfterSeconds);
    }
}
