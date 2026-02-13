-- Final RLS Recursion Fix using Security Definer Functions
BEGIN;

-- 1. Helper functions to check roles without recursion
-- These run as the table owner (Security Definer) so they bypass RLS checks
CREATE OR REPLACE FUNCTION public.check_user_role(target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Clean up and re-apply PROFILES policies
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Super Admins view all" ON public.profiles FOR SELECT
USING (public.check_user_role('super_admin'));

-- 3. Update BOOKINGS policies
-- Allow admins and super admins to see bookings efficiently
DROP POLICY IF EXISTS "Super Admins can view any booking" ON public.bookings;
CREATE POLICY "Super Admins can view any booking" ON public.bookings FOR SELECT
USING (public.check_user_role('super_admin'));

-- No change needed for "Hotel owners can view bookings" as it uses ID comparison

COMMIT;
