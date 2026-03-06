import { getSupabaseAdmin } from "../../src/lib/supabase/admin";

async function main() {
  const supabase = getSupabaseAdmin();
  
  // Find rooms with Standart
  const { data: rooms } = await supabase.from('rooms').select('id, name').ilike('name', '%Standart%');
  
  if (rooms) {
    for (const room of rooms) {
      const newName = room.name.replace(/standart/ig, 'Standard');
      await supabase.from('rooms').update({ name: newName }).eq('id', room.id);
      console.log(`Updated room ${room.id} to ${newName}`);
    }
  }
}
main();
