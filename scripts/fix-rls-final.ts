import { Client } from 'pg';
import 'dotenv/config';

const DATABASE_URL = "postgres://postgres:Uurtsaikh2025$@db.ybwylibmckofuvktvihs.supabase.co:5432/postgres";

const client = new Client({
    connectionString: DATABASE_URL,
});

async function main() {
    console.log("Connecting...");
    await client.connect();

    try {
        const sql = `
      -- 1. DROP ALL EXISTING POLICIES TO START FRESH
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
      DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
      DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
      DROP POLICY IF EXISTS "Allow read access for all users" ON profiles;
      DROP POLICY IF EXISTS "Allow update for own profile" ON profiles;
      DROP POLICY IF EXISTS "Allow full access for admins" ON profiles;
      DROP POLICY IF EXISTS "Allow insert for own profile" ON profiles;
      
      DROP POLICY IF EXISTS "Admins and hotel owners can update hotels" ON hotels;
      DROP POLICY IF EXISTS "Admins can delete hotels" ON hotels;
      DROP POLICY IF EXISTS "Admins can insert hotels" ON hotels;
      DROP POLICY IF EXISTS "Enable read access for all users" ON hotels;
      DROP POLICY IF EXISTS "Admins can insert hotels" ON hotels;
      DROP POLICY IF EXISTS "Admins can update hotels" ON hotels;
      

      -- 2. SIMPLIFIED "is_admin" FUNCTION (JWT ONLY - NO DB LOOKUP)
      -- This guarantees no recursion because we don't query any table.
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT (
          COALESCE(
            current_setting('request.jwt.claim.user_metadata', true)::jsonb ->> 'role',
            (auth.jwt() -> 'user_metadata' ->> 'role')
          ) IN ('admin', 'super_admin')
        );
      $$;

      -- 3. PROFILES POLICIES (Note: SELECT is PUBLIC/TRUE to prevent recursion when querying role)
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

      -- READ: Everyone can read profiles. This is necessary for checking roles without recursion.
      -- If we restrict this, 'is_admin' checks or other queries might fail or recurse if they try to read profile to check permission.
      CREATE POLICY "Enable public read access on profiles"
      ON profiles FOR SELECT
      USING (true);

      -- UPDATE: Users update own, or Admins update any
      CREATE POLICY "Enable update for users and admins"
      ON profiles FOR UPDATE
      USING (auth.uid() = id OR is_admin());

      -- INSERT: Users insert own (on signup), or Admins insert any
      CREATE POLICY "Enable insert for users and admins"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id OR is_admin());

      -- 4. HOTELS POLICIES
      ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

      -- READ: Public
      CREATE POLICY "Enable public read access on hotels"
      ON hotels FOR SELECT
      USING (true);

      -- WRITE (Insert/Update/Delete): Admins Only
      CREATE POLICY "Enable write access for admins on hotels"
      ON hotels FOR ALL
      USING (is_admin());

      -- 5. ROOMS POLICIES
      ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

      -- READ: Public
      CREATE POLICY "Enable public read access on rooms"
      ON rooms FOR SELECT
      USING (true);

      -- WRITE: Admins Only
      CREATE POLICY "Enable write access for admins on rooms"
      ON rooms FOR ALL
      USING (is_admin());

      -- 6. Grant usage
      GRANT USAGE ON SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

    `;

        console.log("Executing Comprehensive RLS Fix...");
        await client.query(sql);
        console.log("Success! Policies reset to Simple & Safe mode.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
