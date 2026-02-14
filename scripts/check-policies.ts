
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function listPolicies() {
    try {
        await client.connect();
        console.log('Connected. Listing policies for "profiles" table...');

        const res = await client.query(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'profiles';
    `);

        console.log('Policies found:', res.rows.length);
        res.rows.forEach(p => {
            console.log(`- Name: "${p.policyname}"`);
            console.log(`  Cmd: ${p.cmd}`);
            console.log(`  Using: ${p.qual}`);
            console.log(`  WithCheck: ${p.with_check}`);
            console.log('---');
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

listPolicies();
