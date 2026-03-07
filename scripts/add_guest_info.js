const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is required to run this script.');
}

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
