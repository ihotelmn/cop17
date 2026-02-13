import { Client } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function applyMigration() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("Missing DATABASE_URL in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        const migrationFile = path.resolve(process.cwd(), "supabase/migrations/20260213_super_admin_policies.sql");
        const sql = fs.readFileSync(migrationFile, "utf8");

        console.log("Applying migration...");
        await client.query(sql);
        console.log("Migration applied successfully!");

    } catch (error) {
        console.error("Error applying migration:", error);
    } finally {
        await client.end();
    }
}

applyMigration();
