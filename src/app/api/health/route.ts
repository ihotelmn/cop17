import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/health
 *
 * Returns:
 *   200 { status: "ok",   db: true, uptime: <sec>, timestamp }  — everything is reachable
 *   503 { status: "fail", db: false, error, timestamp }          — DB (and therefore app) is unusable
 *
 * Wire this into uptime monitoring (Better Stack / UptimeRobot). Keep the
 * check cheap — a single `select 1` against a small table. Do NOT hit
 * Golomt's status endpoint here (external dependency, expensive, out of scope
 * for platform health).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const START_TIME = Date.now();

export async function GET() {
    const timestamp = new Date().toISOString();
    const uptimeSeconds = Math.round((Date.now() - START_TIME) / 1000);

    try {
        const supabase = getSupabaseAdmin();
        // Cheap liveness probe. LIMIT 1 against a tiny table; no filters.
        const { error } = await supabase.from("hotels").select("id").limit(1);
        if (error) throw error;

        return NextResponse.json(
            {
                status: "ok",
                db: true,
                uptimeSeconds,
                timestamp,
                golomtMode: (process.env.GOLOMT_MODE || "auto").toLowerCase(),
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store, must-revalidate",
                },
            }
        );
    } catch (error) {
        return NextResponse.json(
            {
                status: "fail",
                db: false,
                error: error instanceof Error ? error.message : "unknown error",
                timestamp,
            },
            {
                status: 503,
                headers: {
                    "Cache-Control": "no-store, must-revalidate",
                },
            }
        );
    }
}
