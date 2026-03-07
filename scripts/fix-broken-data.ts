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
    console.log("Starting fix script...");

    // 1. Update user role
    const email = "s.erdenebat@gmail.com";
    console.log(`Checking user: ${email}`);

    // Need to find user ID first from auth.users? No, I can't query auth.users directly easily via client unless I use admin listUsers
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Error listing users:", listError);
    } else {
        const user = users.find(u => u.email === email);
        if (user) {
            console.log(`Found user: ${user.id}`);

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ role: 'super_admin' })
                .eq('id', user.id);

            if (updateError) {
                console.error("Error updating profile role:", updateError);
            } else {
                console.log("Successfully updated profile role to super_admin");
            }

            // Also update metadata just in case
            await supabase.auth.admin.updateUserById(user.id, {
                user_metadata: { role: 'super_admin' }
            });
            console.log("Updated user metadata as well.");

        } else {
            console.log("User not found in auth list");
        }
    }

    // 2. Check Hotels Data for corruption
    console.log("\nChecking Hotels Data...");
    const { data: hotels, error: hotelsError } = await supabase
        .from('hotels')
        .select('*');

    if (hotelsError) {
        console.error("Error fetching hotels:", hotelsError);
    } else {
        console.log(`Fetched ${hotels.length} hotels.`);
        for (const hotel of hotels) {
            // Check amenities
            if (hotel.amenities && !Array.isArray(hotel.amenities)) {
                console.warn(`[WARNING] Hotel ${hotel.id} (${hotel.name}) has corrupted amenities (not array):`, hotel.amenities);
            } else if (hotel.amenities) {
                // check if elements are strings
                const badAmenities = hotel.amenities.filter((a: any) => typeof a !== 'string');
                if (badAmenities.length > 0) {
                    console.warn(`[WARNING] Hotel ${hotel.id} (${hotel.name}) has non-string amenities:`, badAmenities);
                    // Attempt to fix
                    const fixedAmenities = hotel.amenities.map((a: any) => typeof a === 'string' ? a : JSON.stringify(a));
                    await supabase.from('hotels').update({ amenities: fixedAmenities }).eq('id', hotel.id);
                    console.log(`-> Fixed amenities for hotel ${hotel.id}`);
                }
            }

            // Check coordinates
            if (typeof hotel.latitude !== 'number' && hotel.latitude !== null) {
                console.warn(`[WARNING] Hotel ${hotel.id} has invalid latitude:`, hotel.latitude);
            }
        }
    }
}

main();
