
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificUser() {
    const email = 's.erdenebat@gmail.com';
    console.log(`\n--- Checking User in Supabase Auth ---`);

    // getUserByEmail is more direct
    const { data: { user }, error } = await supabase.auth.admin.getUserByEmail(email);

    if (error) {
        console.error('❌ Auth Error:', error.message);
        if (error.message.includes('Database error')) {
            console.log('Detected a Supabase Auth database issue. Trying listUsers as fallback...');
            const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
                console.error('❌ List Fallback Error:', listError.message);
            } else {
                const found = usersData.users.find(u => u.email === email);
                if (found) {
                    console.log('✅ Found in list fallback! ID:', found.id);
                } else {
                    console.log('❌ Not found in list fallback either.');
                }
            }
        }
    } else if (user) {
        console.log(`✅ User found in Auth!`);
        console.log(`ID: ${user.id}`);
        console.log(`Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`Last Sign In: ${user.last_sign_in_at}`);
    } else {
        console.log(`❌ User NOT found in Auth.`);
    }

    // Check profiles table again to be 100% sure
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (pError) {
        console.error('❌ Profile Table Error:', pError.message);
    } else {
        console.log(`✅ Profile Table Entry: Found (Role: ${profile.role})`);
    }
    console.log('---------------------------\n');
}

checkSpecificUser();
