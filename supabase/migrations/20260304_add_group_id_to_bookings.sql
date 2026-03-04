ALTER TABLE public.bookings ADD COLUMN group_id UUID;
CREATE INDEX idx_bookings_group_id ON public.bookings(group_id);
