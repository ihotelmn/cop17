CREATE INDEX IF NOT EXISTS idx_bookings_active_overlap_window
  ON public.bookings(room_id, check_in_date, check_out_date, created_at)
  WHERE status IN ('pending', 'confirmed', 'paid');
