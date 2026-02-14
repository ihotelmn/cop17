
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runFix() {
    console.log('Applying RLS fix...');

    const sql = `
    -- 1. Create a secure function to check admin status (bypasses RLS)
    CREATE OR REPLACE FUNCTION is_admin()
    RETURNS BOOLEAN 
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

    -- 2. Create a secure function to check own profile (bypasses RLS recursion)
    CREATE OR REPLACE FUNCTION is_owner(user_id uuid)
    RETURNS BOOLEAN 
    LANGUAGE sql 
    SECURITY DEFINER 
    SET search_path = public
    AS $$
      SELECT auth.uid() = user_id;
    $$;

    -- 3. Drop existing problematic policies on profiles
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

    -- 4. Re-create policies using secure functions
    
    -- Everyone can read profiles (needed for hotel owners to be seen?) 
    -- Actually, usually users only need to read their own or public info.
    -- Let's allow users to read their own, and admins to read all.
    
    CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (is_admin());

    CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (is_admin());

    CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

  `;

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    // Wait, execution of raw SQL via RPC requires a stored procedure 'exec_sql' usually.
    // Standard supabase-js doesn't run raw SQL on client unless we have a specific function.
    // BUT the postgres migration tool uses direct connection.

    // Alternative: Use the 'pg' library to connect directly to DATABASE_URL?
    // User provided DATABASE_URL in .env.local!
    // "DATABASE_URL=postgres://postgres:Uurtsaikh2025$@db.ybwylibmckofuvktvihs.supabase.co:5432/postgres"

    // So I should use 'pg' (node-postgres) to run this.
}

// ... I will rewrite this script to use 'pg' as it is more reliable for DDL.
