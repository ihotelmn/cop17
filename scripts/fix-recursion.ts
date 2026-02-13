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
      -- Improved is_admin function to completely avoid recursion on 'profiles' table.
      -- It queries 'auth.users' directly (via raw_user_meta_data) instead of 'public.profiles'.
      -- Since this function is SECURITY DEFINER and created by postgres, it can read auth.users.
      
      CREATE OR REPLACE FUNCTION public.is_admin()
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, auth 
      AS $$
      BEGIN
        -- 1. Try to read from JWT first (fastest, no DB lookup)
        IF (current_setting('request.jwt.claims', true) IS NOT NULL) THEN
           IF ((current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')) THEN
             RETURN true;
           END IF;
        END IF;

        -- 2. Fallback: Query auth.users directly. 
        -- This avoids querying 'public.profiles' which triggers the recursion.
        RETURN EXISTS (
          SELECT 1 FROM auth.users
          WHERE id = auth.uid()
          AND (raw_user_meta_data ->> 'role') IN ('admin', 'super_admin')
        );
      END;
      $$;

      -- Ensure policies use this function consistently
      -- (No change needed to policies if they already call is_admin(), but let's just log success)
    `;

        console.log("Executing SQL Update...");
        await client.query(sql);
        console.log("Success! RLS Recursion fixed by using auth.users metadata.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

main();
