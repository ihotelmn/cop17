import { Client } from 'pg';
import 'dotenv/config';

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
          
          -- 3. Ensure SELECT policy allows guests to see their newly created booking 
          -- if we want INSERT ... RETURNING to work without error on client side.
          -- However, since the server action uses standard Supabase client, 
          -- it might still fail if RLS blocks the return.
          
          -- Let's relax the SELECT policy for Pendings if we can, or just rely on 
          -- the fact that the server action can optionally use service role.
          
          -- Actually, let's keep it simple: allow insert for everyone.
          
          GRANT ALL ON public.bookings TO anon;
          GRANT ALL ON public.bookings TO authenticated;
          GRANT ALL ON public.bookings TO service_role;
        `;

        console.log("Fixing Bookings RLS for Guest Checkout...");
        await client.query(sql);
        console.log("Success! Guest bookings allowed.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
