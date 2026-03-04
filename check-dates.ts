
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkBookingDates() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) { return; }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: bookings } = await supabase
        .from("bookings")
        .select("id, room_id, status, check_in_date, check_out_date, room:rooms(name, hotel:hotels(name))")
        .eq("status", "confirmed")
        .ilike("room.hotel.name", "%Blue Sky%");

    console.log("Confirmed Blue Sky Bookings:");
    bookings?.forEach(b => {
        // @ts-ignore
        console.log(`- Room: ${b.room.name}, Dates: ${b.check_in_date} to ${b.check_out_date}`);
    });
}

checkBookingDates();
