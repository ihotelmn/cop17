
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testFilter() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) { return; }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const roomId = "4901f681-4560-5f28-a400-01968508e9cc"; // Делакс Твин Өрөө
    const checkIn = "2026-03-04";
    const checkOut = "2026-03-05";
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    console.log("Testing filter for room:", roomId);

    // Test 1: Simple confirm check
    const { data: t1 } = await supabase.from("bookings")
        .select("id")
        .eq("room_id", roomId)
        .eq("status", "confirmed");
    console.log("Confirmed total:", t1?.length);

    // Test 2: Overlap check only
    const { data: t2 } = await supabase.from("bookings")
        .select("id")
        .eq("room_id", roomId)
        .lt("check_in_date", checkOut)
        .gt("check_out_date", checkIn);
    console.log("Overlapping total (any status):", t2?.length);

    // Test 3: The actual complex filter
    const { data: t3, error: e3 } = await supabase.from("bookings")
        .select("id")
        .eq("room_id", roomId)
        .lt("check_in_date", checkOut)
        .gt("check_out_date", checkIn)
        .or(`status.eq.confirmed,and(status.eq.pending,created_at.gte.${fifteenMinutesAgo})`);

    if (e3) {
        console.error("Filter Error:", e3);
    } else {
        console.log("Complex filter results:", t3?.length);
    }
}

testFilter();
