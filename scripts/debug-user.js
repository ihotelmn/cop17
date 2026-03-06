
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUser() {
    const email = 'admin@cop17.mn';
    console.log(`\n--- Supabase Auth Check ---`);
    console.log(`Checking email: ${email}`);

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log(`❌ User ${email} NOT FOUND in Auth.`);
        console.log(`Available users: ${users.map(u => u.email).join(', ')}`);
        return;
    }

    console.log(`✅ User exists in Auth. ID: ${user.id}`);

    // 2. Check in Profiles table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('❌ Profile Error:', profileError.message);
    } else {
        console.log(`✅ Profile found: Role = ${profile.role}`);
        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
            console.warn(`⚠️ Warning: User is NOT an admin in the profiles table!`);
        }
    }
    console.log('---------------------------\n');
}

checkAdminUser();
