import { Client } from 'pg';
import 'dotenv/config';

// Hardcoding for certainty in this fix script, matching previous scripts
const DATABASE_URL = "postgres://postgres:Uurtsaikh2025$@db.ybwylibmckofuvktvihs.supabase.co:5432/postgres";

const client = new Client({
    connectionString: DATABASE_URL,
});

async function main() {
    console.log("Connecting to DB...");
    await client.connect();

    try {
        const sql = `
      -- 1. Enable RLS on bookings
      ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

      -- 2. Drop existing policies to start fresh
      DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
      DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
      DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
      DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
      DROP POLICY IF EXISTS "Users can insert bookings" ON bookings;
      DROP POLICY IF EXISTS "Enable read access for all users" ON bookings;
      DROP POLICY IF EXISTS "Service Role can do everything" ON bookings;

      -- 3. Create Policies

      -- READ: Admins (All), Users (Own)
      CREATE POLICY "Admins can view all bookings"
      ON bookings FOR SELECT
      USING (is_admin());

      CREATE POLICY "Users can view own bookings"
      ON bookings FOR SELECT
      USING (auth.uid() = user_id);

      -- WRITE (Update): Admins Only (Status updates)
      CREATE POLICY "Admins can update bookings"
      ON bookings FOR UPDATE
      USING (is_admin());

      -- INSERT: Authenticated Users (Creating a booking) regarding of role?
      -- Usually created via server action with service role or user
      CREATE POLICY "Users can insert bookings"
      ON bookings FOR INSERT
      WITH CHECK (auth.uid() = user_id OR is_admin());
      
      -- Also allow public insert if anonymous booking is a thing? 
      -- Assuming auth is required based on schema (user_id).
      
      -- Grant access
      GRANT ALL ON bookings TO authenticated;
      GRANT ALL ON bookings TO service_role;
    `;

        console.log("Applying Bookings RLS Policies...");
        await client.query(sql);
        console.log("Success! Bookings policies applied.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
