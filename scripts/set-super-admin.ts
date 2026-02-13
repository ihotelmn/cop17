import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setSuperAdmin(email: string) {
    console.log(`Setting super_admin role for: ${email}`);

    // 1. Get user by email to verify existence
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error("Error listing users:", userError);
        return;
    }

    console.log("Found users:", users.map(u => u.email));

    const user = users.find((u) => u.email === email);

    if (!user) {
        console.error(`User with email ${email} not found.`);
        return;
    }

    console.log(`Found user: ${user.id}`);

    // 2. Update profiles table directly (since service role bypasses RLS)
    const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "super_admin" })
        .eq("id", user.id);

    if (updateError) {
        console.error("Error updating profile:", updateError);
    } else {
        console.log(`Successfully updated role to super_admin for ${email}`);
    }
}

// Get email from command line args
const targetEmail = process.argv[2];

if (!targetEmail) {
    console.error("Please provide an email address as argument.");
    console.error("Usage: npx tsx scripts/set-super-admin.ts <email>");
    process.exit(1);
}

setSuperAdmin(targetEmail);
