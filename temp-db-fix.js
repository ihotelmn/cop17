const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Basic manual dotenv parser because we're running a simple script
function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

loadEnv(path.join(process.cwd(), '.env.local'));

async function fix() {
    console.log('Attempting to connect to Supabase DB...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    try {
        await client.connect();
        console.log('Connected to DB');
        await client.query('ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
        console.log('Successfully completed schema update');
    } catch (err) {
        console.error('CRITICAL DATABASE ERROR:', err);
    } finally {
        await client.end();
    }
}

fix();
