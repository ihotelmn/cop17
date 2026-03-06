
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findAdmins() {
    console.log(`\n--- Searching for Admins in Profiles ---`);
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .in('role', ['admin', 'super_admin']);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log(`✅ Found ${profiles.length} admins:`);
        profiles.forEach(p => console.log(`- ${p.email} (${p.role})`));
    }
}

findAdmins();
