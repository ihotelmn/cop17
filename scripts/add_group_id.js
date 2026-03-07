const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run this script.');
}

async function main() {
    const client = new Client({
        connectionString: databaseUrl
    });

    await client.connect();

    try {
        const res1 = await client.query('ALTER TABLE public.bookings ADD COLUMN group_id UUID;');
        console.log("Added group_id column", res1);
    } catch (e) { console.log(e.message); }

    try {
        const res2 = await client.query('CREATE INDEX idx_bookings_group_id ON public.bookings(group_id);');
        console.log("Added index", res2);
    } catch (e) { console.log(e.message); }

    await client.end();
}
main();
