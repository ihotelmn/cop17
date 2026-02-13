-- Create Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for guest checkout
  
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, paid
  total_price NUMERIC NOT NULL DEFAULT 0,
  
  -- Encrypted PII
  guest_passport_encrypted TEXT NOT NULL,
  guest_phone_encrypted TEXT NOT NULL,
  special_requests_encrypted TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX idx_bookings_dates ON public.bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Insert: Public (for guest checkout) or Authenticated
-- Anyone can create a booking (pending state)
DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
CREATE POLICY "Anyone can insert bookings" ON public.bookings FOR INSERT 
WITH CHECK (true);

-- 2. View:
-- Users can view their own bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

-- Hotel Owners/Admins can view bookings for their rooms
-- This requires a join, which can be expensive, but necessary
DROP POLICY IF EXISTS "Hotel owners can view bookings" ON public.bookings;
CREATE POLICY "Hotel owners can view bookings" ON public.bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.hotels h ON r.hotel_id = h.id
    WHERE r.id = room_id AND h.owner_id = auth.uid()
  )
);

-- 3. Update:
-- Users can cancel their own pending bookings? Check logic later.
-- For now, let's allow owners to update status (e.g. check-in, cancel)
DROP POLICY IF EXISTS "Hotel owners can update bookings" ON public.bookings;
CREATE POLICY "Hotel owners can update bookings" ON public.bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.hotels h ON r.hotel_id = h.id
    WHERE r.id = room_id AND h.owner_id = auth.uid()
  )
);
