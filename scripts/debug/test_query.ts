import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
    const q = `%Ulaanbaatar%`;
    let queryBuilder = supabase.from("hotels").select(`name, address`).or(`name.ilike.${q},address.ilike.${q}`);
    const { data: hotels, error } = await queryBuilder;
    if (error) console.error(error);
    console.log(`Matched hotels containing Ulaanbaatar: ${hotels?.length}`);
    hotels?.forEach(h => {
        console.log(`${h.name} - ${h.address}`);
    });
}
main();
