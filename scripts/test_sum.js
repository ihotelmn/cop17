require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // By default Supabase JS limits to 1000 rows. We need to paginate if we sum in JS, or we use an RPC.
  // Let's first check how many rows there are.
  const { count, error } = await supabase.from('rooms').select('*', { count: 'exact', head: true });
  console.log(`Total Rooms in DB: ${count}`);

  let totalInventorySum = 0;
  let from = 0;
  let limit = 1000;
  
  while (from < count) {
      const { data } = await supabase.from('rooms').select('total_inventory').range(from, from + limit - 1);
      if (data) {
          totalInventorySum += data.reduce((acc, r) => acc + (r.total_inventory || 0), 0);
      }
      from += limit;
  }
  
  console.log(`Actual Sum of total_inventory = ${totalInventorySum}`);
}
run();
