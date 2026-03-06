import { getSupabaseAdmin } from "../../src/lib/supabase/admin";

async function main() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.from('bookings').select('user_id').limit(1);
  console.log('Bookings query:', { error });

  const guestEmail = 'guest_' + Date.now() + '@ihotel.mn';
  const { data: user, error: authErr } = await supabase.auth.admin.createUser({
    email: guestEmail,
    password: 'guestpassword123',
    email_confirm: true
  });
  console.log('Created dummy user email:', guestEmail, 'Error:', authErr);
}
main();
