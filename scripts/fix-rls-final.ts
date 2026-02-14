
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runFix() {
  try {
    await client.connect();
    console.log('Connected. Dropping all policies on profiles...');

    const policiesToDrop = [
      "View own profile",
      "Super Admins can view all profiles",
      "Super Admins can update any profile",
      "Enable public read access on profiles",
      "Enable update for users and admins",
      "Enable insert for users and admins",
      "Users can view own profile",
      "Admins can view all profiles",
      "Users can update own profile",
      "Admins can update all profiles",
      "Users can insert their own profile"
    ];

    for (const policy of policiesToDrop) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${policy}" ON profiles;`);
        console.log(`Dropped: ${policy}`);
      } catch (e) {
        console.log(`Failed to drop ${policy}: ${e}`);
      }
    }

    console.log('Re-creating clean policies...');

    const sql = `
      -- Ensure is_admin function exists and is secure
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

      GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

      -- 1. SELECT: Users see own, Admins see all. 
      --    Also allow public read if needed? Safe strict default:
      CREATE POLICY "Users can view own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);

      CREATE POLICY "Admins can view all profiles" ON profiles
      FOR SELECT USING (is_admin());

      -- 2. UPDATE: Users update own, Admins update all.
      CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);

      CREATE POLICY "Admins can update all profiles" ON profiles
      FOR UPDATE USING (is_admin());

      -- 3. INSERT: Users insert own.
      CREATE POLICY "Users can insert their own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
    `;

    await client.query(sql);
    console.log('All done. Recursion should be fixed.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

runFix();
