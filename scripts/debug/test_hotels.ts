import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
    const { data: hotels, error } = await supabase.from("hotels").select(`name, rooms(capacity, total_inventory)`);
    if (error) console.error(error);
    hotels?.forEach(h => {
        const cap = h.rooms?.reduce((sum, r) => sum + (Number(r.capacity) * Number(r.total_inventory || 0)), 0);
        console.log(`${h.name} - Rooms: ${h.rooms?.length} - Total Cap: ${cap} - Inventories: ${h.rooms?.map(r => r.total_inventory).join(',')}`);
    });
}
main();
