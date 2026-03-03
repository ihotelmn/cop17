const { Client } = require('pg');
require('dotenv').config();

const DATABASE_URL = "postgres://postgres:Uurtsaikh2025$@db.ybwylibmckofuvktvihs.supabase.co:5432/postgres";

const client = new Client({
    connectionString: DATABASE_URL,
});

async function main() {
    console.log("Connecting to DB...");
    await client.connect();

    try {
        const sql = `
          -- 1. Drop the restrictive insert policies
          DROP POLICY IF EXISTS "Users can insert bookings" ON public.bookings;
          DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
          
          -- 2. Create a more permissive insert policy for guest and authenticated checkout
          CREATE POLICY "Anyone can insert bookings" 
          ON public.bookings FOR INSERT 
          WITH CHECK (true);
          
          GRANT ALL ON public.bookings TO anon;
          GRANT ALL ON public.bookings TO authenticated;
          GRANT ALL ON public.bookings TO service_role;
        `;

        console.log("Fixing Bookings RLS for Guest Checkout (JS)...");
        await client.query(sql);
        console.log("Success! Guest bookings allowed.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
