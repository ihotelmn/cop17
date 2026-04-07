import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

async function setStoragePolicies() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("Missing DATABASE_URL");
        return;
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Applying Storage Policies for 'hotel-images'...");
        
        // 1. Enable Public SELECT
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects') THEN
                    CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'hotel-images');
                END IF;
            END
            $$;
        `);

        // 2. Allow ALL (INSERT, UPDATE, DELETE) for simplify in this platform
        // In product you'd restrict, but delegates need it to work now
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Full Access' AND tablename = 'objects') THEN
                    CREATE POLICY "Allow Full Access" ON storage.objects FOR ALL WITH CHECK (bucket_id = 'hotel-images');
                END IF;
            END
            $$;
        `);

        console.log("Policies applied successfully.");
    } catch (err) {
        console.error("Error applying policies:", err);
    } finally {
        await pool.end();
    }
}

setStoragePolicies();
