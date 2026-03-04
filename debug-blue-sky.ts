
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugAvailability() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) { return; }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get Blue Sky Hotel
    const { data: hotels } = await supabase.from("hotels").select("id, name").ilike("name", "%Blue Sky%").limit(1);
    const hotel = hotels?.[0];
    if (!hotel) { console.log("Blue Sky not found"); return; }
    console.log(`HOTEL: ${hotel.name} (${hotel.id})`);

    // 2. Get Rooms
    const { data: rooms } = await supabase.from("rooms").select("id, name, total_inventory").eq("hotel_id", hotel.id);
    console.log(`ROOMS: ${rooms?.length || 0}`);

    for (const r of rooms || []) {
        const { data: bookings } = await supabase.from("bookings").select("id, status").eq("room_id", r.id);
        const { data: confirmed } = await supabase.from("bookings").select("id").eq("room_id", r.id).eq("status", "confirmed");
        const { data: pending } = await supabase.from("bookings").select("id").eq("room_id", r.id).eq("status", "pending");

        console.log(`- Room: ${r.name}, Inv: ${r.total_inventory}, TotalBookings: ${bookings?.length || 0}, Confirmed: ${confirmed?.length || 0}, Pending: ${pending?.length || 0}`);

        // Check if any booking is actually recent
        const { data: recentPending } = await supabase.from("bookings")
            .select("id, created_at")
            .eq("room_id", r.id)
            .eq("status", "pending")
            .gt("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());

        console.log(`  RecentPending (<15m): ${recentPending?.length || 0}`);
    }
}

debugAvailability();
