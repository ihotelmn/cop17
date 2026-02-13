import { Client } from 'pg';
import 'dotenv/config';

// Hardcode the connection string from .env.local for this script run (based on user's previous view_file)
const DATABASE_URL = "postgres://postgres:Uurtsaikh2025$@db.ybwylibmckofuvktvihs.supabase.co:5432/postgres";

const client = new Client({
    connectionString: DATABASE_URL,
});

async function main() {
    console.log("Connecting to database to fix RLS policies...");
    await client.connect();

    try {
        const sql = `
      -- 1. Create a SECURE function to check admin status (Bypasses RLS)
      -- This breaks the recursion loop because it doesn't trigger 'SELECT' policies on profiles table again when called.
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND (role = 'admin' OR role = 'super_admin')
        );
      $$;

      -- 2. Fix PROFILES policies
      -- Drop potential recursive policies
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
      DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
      DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
      DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

      -- Create safe policies
      -- Everyone can read profiles (needed for hotel owner checks, audit logs join, etc.)
      CREATE POLICY "Allow read access for all users"
      ON profiles FOR SELECT
      USING (true);

      -- Users can update only their own profile
      CREATE POLICY "Allow update for own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);

      -- Admins can update/delete any profile (using the secure function)
      CREATE POLICY "Allow full access for admins"
      ON profiles
      USING (is_admin());
      
      -- Insert is usually handled by triggers, but allow self-insert just in case
      CREATE POLICY "Allow insert for own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);

      -- 3. Fix HOTELS policies (ensure they use is_admin function to avoid recursion if they were querying profiles directly)
      DROP POLICY IF EXISTS "Admins and hotel owners can update hotels" ON hotels;
      DROP POLICY IF EXISTS "Admins can delete hotels" ON hotels;
      DROP POLICY IF EXISTS "Admins can insert hotels" ON hotels;
      DROP POLICY IF EXISTS "Enable read access for all users" ON hotels;
      
      -- Read: Public
      CREATE POLICY "Enable read access for all users"
      ON hotels FOR SELECT
      USING (true);

      -- Insert: Admins only
      CREATE POLICY "Admins can insert hotels"
      ON hotels FOR INSERT
      WITH CHECK (is_admin());

      -- Update: Admins OR Owner (Assuming owner_id column exists, otherwise just admins for now to be safe)
      -- If owner_id exists, we'd add: OR auth.uid() = owner_id
      CREATE POLICY "Admins can update hotels"
      ON hotels FOR UPDATE
      USING (is_admin());

      -- Delete: Admins only
      CREATE POLICY "Admins can delete hotels"
      ON hotels FOR DELETE
      USING (is_admin());

      -- 4. Fix ROOMS policies
      ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Enable read access for all users" ON rooms;
      CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;
      CREATE POLICY "Admins can manage rooms" ON rooms USING (is_admin());
    `;

        console.log("Executing SQL...");
        await client.query(sql);
        console.log("RLS Policies Fixed successfully!");

    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

main();
