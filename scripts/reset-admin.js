
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetUserPassword() {
    const userId = '5b995094-e5d4-49cb-822d-7cd298f2b6dd';
    const newPassword = 'password123456';

    console.log(`\n--- Resetting Password for UID: ${userId} ---`);

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
        email_confirm: true // Also ensure email is confirmed
    });

    if (error) {
        console.error('❌ Error resetting password:', error.message);
        console.log('If the user doesn\'t exist in Auth (even if they exist in Profiles), creating them now...');

        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            id: userId, // Try to preserve the ID
            email: 's.erdenebat@gmail.com',
            password: newPassword,
            email_confirm: true,
            user_metadata: { role: 'super_admin' }
        });

        if (createError) {
            console.error('❌ Error creating user:', createError.message);
        } else {
            console.log('✅ User created in Auth with password: ' + newPassword);
        }
    } else {
        console.log(`✅ Password successfully reset to: ${newPassword}`);
    }
}

resetUserPassword();
