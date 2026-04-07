import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";

async function setupAmenitiesTable() {
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
        console.log("Checking/Creating amenities table and policies...");
        
        // 1. Create table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.amenities (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                created_at TIMESTAMPTZ DEFAULT now()
            );
        `);

        // 2. Enable RLS
        await pool.query(`ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;`);

        // 3. Drop existing policies to avoid conflicts for this fix
        await pool.query(`DROP POLICY IF EXISTS "Public read amenities" ON public.amenities;`);
        await pool.query(`DROP POLICY IF EXISTS "Authenticated users can insert amenities" ON public.amenities;`);

        // 4. Create Policies
        await pool.query(`
            CREATE POLICY "Public read amenities" ON public.amenities FOR SELECT USING (true);
            CREATE POLICY "Authenticated users can insert amenities" ON public.amenities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        `);

        console.log("Amenities setup complete.");
        
        // Seed some common amenities if empty
        const { rowCount } = await pool.query(`SELECT 1 FROM public.amenities LIMIT 1`);
        if (rowCount === 0) {
            console.log("Seeding common amenities...");
            const common = [
                "Free WiFi", "Swimming Pool", "Spa", "Gym", "Air Conditioning", 
                "Room Service", "Airport Shuttle", "Restaurant", "Bar", "Laundry Service",
                "Non-smoking Rooms", "24-hour Front Desk", "Safe", "Heating", "Breakfast"
            ];
            for (const name of common) {
                await pool.query(`INSERT INTO public.amenities (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
            }
            console.log("Seeding complete.");
        }

    } catch (err) {
        console.error("Error setting up amenities:", err);
    } finally {
        await pool.end();
    }
}

setupAmenitiesTable();
