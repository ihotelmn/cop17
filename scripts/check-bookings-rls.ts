import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log("Checking bookings table RLS...");

    // We can't easily check RLS enabled status via JS client without SQL.
    // But we can try to fetch as anon.

    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Try to select
    const { data, error } = await anonClient.from('bookings').select('*').limit(1);

    if (error) {
        console.log("Anon Fetch Error (Expected if RLS is on and no policy):", error.message);
    } else {
        console.log("Anon Fetch Success (Risky if RLS is off):", data);
    }

    // Check if we can select as Admin (using helper or just service role)
    const { data: adminData, error: adminError } = await supabase.from('bookings').select('*').limit(1);
    console.log("Service Role Fetch:", adminError ? "Error: " + adminError.message : "Success");
}

checkRLS();
