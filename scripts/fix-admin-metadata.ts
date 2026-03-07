import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to run this script.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function main() {
    console.log("Starting full admin fix...");

    const email = "s.erdenebat@gmail.com";

    // 1. Get User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log(`Found user ${user.email} (${user.id})`);

    // 2. Update Profile Role (DB)
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', user.id);

    if (profileError) console.error("Profile update error:", profileError);
    else console.log("Profile role updated to super_admin");

    // 3. Update Auth Metadata (For JWT Claim)
    // This is CRITICAL because our new is_admin() function relies on JWT metadata!
    const { data: userUpdate, error: metaError } = await supabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: { ...user.user_metadata, role: 'super_admin' } }
    );

    if (metaError) console.error("Metadata update error:", metaError);
    else console.log("User metadata updated to super_admin (This fixes JWT claims for next login)");

    // 4. Force refresh of session? 
    // User needs to logout and login again to get new JWT with updated metadata.

    console.log("---------------------------------------------------");
    console.log("IMPORTANT: User MUST Log out and Log back in to receive the new JWT with 'super_admin' role.");
    console.log("---------------------------------------------------");
}

main();
