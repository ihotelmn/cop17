-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for exclusion constraints

-- 2. Create Tables

-- PROFILES (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  -- Role check will be updated later, starting with basic
  role TEXT DEFAULT 'guest',
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HOTELS
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  stars INTEGER DEFAULT 5,
  amenities TEXT[], 
  images TEXT[], 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROOMS
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, 
  price_per_night DECIMAL(10, 2) NOT NULL,
  capacity INTEGER DEFAULT 2,
  amenities TEXT[],
  images TEXT[],
  -- Inventory column (added from migration)
  total_inventory INTEGER NOT NULL DEFAULT 0 CHECK (total_inventory >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Encrypted Fields
  guest_passport_encrypted TEXT, 
  guest_phone_encrypted TEXT,
  special_requests_encrypted TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT dates_check CHECK (check_out_date > check_in_date)
  
  -- Exclusion constraint (optional if btree_gist is off, but recommended)
  -- CONSTRAINT no_double_booking EXCLUDE USING gist (
  --   room_id WITH =,
  --   daterange(check_in_date, check_out_date, '[)') WITH &&
  -- ) WHERE (status != 'cancelled')
);

-- 3. Update Constraints & Roles (From Migrations)

-- Drop constraint if exists to update it
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'vip', 'guest'));

-- 4. Enable RLS

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies

-- Public Read
DROP POLICY IF EXISTS "Public hotels" ON public.hotels;
CREATE POLICY "Public hotels" ON public.hotels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public rooms" ON public.rooms;
CREATE POLICY "Public rooms" ON public.rooms FOR SELECT USING (true);

-- Profiles
DROP POLICY IF EXISTS "View own profile" ON public.profiles;
CREATE POLICY "View own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Bookings
DROP POLICY IF EXISTS "View own bookings" ON public.bookings;
CREATE POLICY "View own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Create bookings" ON public.bookings;
CREATE POLICY "Create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Triggers (Auto create profile)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, organization)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Guest'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest'),
    NEW.raw_user_meta_data->>'organization'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Audit Log Trigger
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    auth.uid()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_bookings_changes ON public.bookings;
CREATE TRIGGER audit_bookings_changes
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION log_audit_event();
