require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('rooms').select('total_inventory, capacity');
  if (error) console.error(error);
  
  console.log(`Fetched ${data.length} rows.`);
  const inventorySum = data.reduce((acc, row) => acc + (row.total_inventory || 0), 0);
  const capacitySum = data.reduce((acc, row) => acc + (row.capacity || 0), 0);
  
  console.log(`Total Inventory Sum: ${inventorySum}`);
  console.log(`Total Capacity Sum: ${capacitySum}`);
}

run();
