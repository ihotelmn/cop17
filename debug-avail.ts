
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugAvailability() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing keys");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get a Blue Sky room ID
    const { data: rooms } = await supabase
        .from("rooms")
        .select("id, name, total_inventory, hotel:hotels(name)")
        .ilike("hotel.name", "%Blue Sky%")
        .limit(5);

    if (!rooms || rooms.length === 0) {
        console.log("No rooms found");
        return;
    }

    const room = rooms[0];
    console.log(`Room: ${room.name} (${room.id})`);
    console.log(`Hotel: ${room.hotel.name}`);
    console.log(`Total Inventory in DB: ${room.total_inventory}`);

    // 2. Count bookings
    const { data: allBookings } = await supabase
        .from("bookings")
        .select("id, status, created_at, check_in_date, check_out_date")
        .eq("room_id", room.id);

    console.log(`Total Bookings for this room: ${allBookings?.length || 0}`);
    allBookings?.forEach(b => {
        console.log(`- ID: ${b.id}, Status: ${b.status}, CreatedAt: ${b.created_at}, Dates: ${b.check_in_date} to ${b.check_out_date}`);
    });

    // 3. Test the exact filter used in the code
    const checkIn = "2026-03-04";
    const checkOut = "2026-03-05";
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: overlapping, error } = await supabase
        .from("bookings")
        .select("id")
        .eq("room_id", room.id)
        .lt("check_in_date", checkOut)
        .gt("check_out_date", checkIn)
        .or(`status.eq.confirmed,and(status.eq.pending,created_at.gte.${fifteenMinutesAgo})`);

    if (error) {
        console.error("Filter Error:", error);
    } else {
        console.log(`Overlapping matching bookings count: ${overlapping?.length || 0}`);
    }
}

debugAvailability();
