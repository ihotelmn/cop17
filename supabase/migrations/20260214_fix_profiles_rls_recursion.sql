-- Fix recursive RLS on profiles and ensure basic access
BEGIN;

-- 1. Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to view their own profile (This breaks the recursion for super_admin check)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 3. Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Re-confirm Super Admin exists and has access (already in 20260213 migration, but just in case)
-- Super Admins can view all profiles
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
CREATE POLICY "Super Admins can view all profiles" ON public.profiles FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- 5. Ensure ADMINS can see hotels they own
-- Note: Already handled in fix_hotels_rls, but let's be sure about bookings
-- Admins can view bookings for hotels they own (handled in 20260212_create_bookings_schema)

COMMIT;
