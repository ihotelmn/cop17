
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    console.log(`\n--- Supabase Connection Test ---`);
    const { data, count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Database Error:', error.message);
    } else {
        console.log(`✅ Database connection successful. Profile count: ${count}`);
    }

    // Test Auth list again but catch error
    console.log(`\n--- Auth API Test ---`);
    try {
        const { data: users, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('❌ Auth API Error:', authError.message, authError.status);
        } else {
            console.log(`✅ Auth API successful. User count: ${users.users.length}`);
        }
    } catch (e) {
        console.error('❌ Exception in Auth API:', e.message);
    }
    console.log('---------------------------\n');
}

testConnection();
