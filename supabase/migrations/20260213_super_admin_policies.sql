-- Super Admin Policies for Hotels, Rooms, Bookings

-- 1. HOTELS
-- Super Admins can update any hotel
DROP POLICY IF EXISTS "Super Admins can update any hotel" ON public.hotels;
CREATE POLICY "Super Admins can update any hotel" ON public.hotels FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Super Admins can delete any hotel
DROP POLICY IF EXISTS "Super Admins can delete any hotel" ON public.hotels;
CREATE POLICY "Super Admins can delete any hotel" ON public.hotels FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);


-- 2. ROOMS
-- Enable RLS on rooms (just in case)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Super Admins can view any room
DROP POLICY IF EXISTS "Super Admins can view any room" ON public.rooms;
CREATE POLICY "Super Admins can view any room" ON public.rooms FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Super Admins can insert any room (usually restricted to hotel owner, but super admin can too)
DROP POLICY IF EXISTS "Super Admins can insert any room" ON public.rooms;
CREATE POLICY "Super Admins can insert any room" ON public.rooms FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Super Admins can update any room
DROP POLICY IF EXISTS "Super Admins can update any room" ON public.rooms;
CREATE POLICY "Super Admins can update any room" ON public.rooms FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Super Admins can delete any room
DROP POLICY IF EXISTS "Super Admins can delete any room" ON public.rooms;
CREATE POLICY "Super Admins can delete any room" ON public.rooms FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);


-- 3. BOOKINGS
-- Super Admins can view any booking
DROP POLICY IF EXISTS "Super Admins can view any booking" ON public.bookings;
CREATE POLICY "Super Admins can view any booking" ON public.bookings FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Super Admins can update any booking
DROP POLICY IF EXISTS "Super Admins can update any booking" ON public.bookings;
CREATE POLICY "Super Admins can update any booking" ON public.bookings FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Super Admins can delete any booking (rare but possible)
DROP POLICY IF EXISTS "Super Admins can delete any booking" ON public.bookings;
CREATE POLICY "Super Admins can delete any booking" ON public.bookings FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);


-- 4. PROFILES and USERS (Managed via Supabase Auth API mostly, but public.profiles needs access)
-- Super Admins can view all profiles
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
CREATE POLICY "Super Admins can view all profiles" ON public.profiles FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Super Admins can update any profile (e.g. change role)
DROP POLICY IF EXISTS "Super Admins can update any profile" ON public.profiles;
CREATE POLICY "Super Admins can update any profile" ON public.profiles FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);
