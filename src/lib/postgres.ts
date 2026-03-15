import "server-only";
import { Pool } from "pg";
import { normalizeEnvValue } from "@/lib/env";

let pool: Pool | null = null;

function requiresSsl(connectionString: string) {
    return !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");
}

export function getPostgresPool() {
    const connectionString = normalizeEnvValue(process.env.DATABASE_URL);

    if (!connectionString) {
        throw new Error("Missing required environment variable: DATABASE_URL");
    }

    if (!pool) {
        pool = new Pool({
            connectionString,
            ssl: requiresSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
            max: 10,
        });
    }

    return pool;
}
