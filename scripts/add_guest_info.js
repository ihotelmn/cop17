const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// We extract the connection string from the Supabase URL or use a direct postgres connection string if available.
// Since Supabase usually provides a postgresql:// connection string in the dashboard:
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:54322/postgres'; // Default local supabase port

async function addGuestColumns() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // Add guest_name column
        try {
            await client.query(`
        ALTER TABLE public.bookings
        ADD COLUMN guest_name TEXT;
      `);
            console.log('Added guest_name column successfully.');
        } catch (e) {
            console.log(e.message);
        }

        // Add guest_email column
        try {
            await client.query(`
        ALTER TABLE public.bookings
        ADD COLUMN guest_email TEXT;
      `);
            console.log('Added guest_email column successfully.');
        } catch (e) {
            console.log(e.message);
        }

    } catch (err) {
        console.error('Connection error', err.stack);
    } finally {
        await client.end();
    }
}

addGuestColumns();
