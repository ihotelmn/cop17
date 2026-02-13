-- Create Rooms table if not exists
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  price_per_night NUMERIC NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 2,
  total_inventory INTEGER NOT NULL DEFAULT 0,
  amenities TEXT[],
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist (idempotent)
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS total_inventory INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS amenities TEXT[];
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS price_per_night NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 2;

-- RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. View: Public
DROP POLICY IF EXISTS "Public can view rooms" ON public.rooms;
CREATE POLICY "Public can view rooms" ON public.rooms FOR SELECT USING (true);

-- 2. Insert: Owners only
DROP POLICY IF EXISTS "Owners can insert rooms" ON public.rooms;
CREATE POLICY "Owners can insert rooms" ON public.rooms FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM public.hotels WHERE id = hotel_id AND owner_id = auth.uid())
);

-- 3. Update: Owners only
DROP POLICY IF EXISTS "Owners can update rooms" ON public.rooms;
CREATE POLICY "Owners can update rooms" ON public.rooms FOR UPDATE
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM public.hotels WHERE id = hotel_id AND owner_id = auth.uid())
);

-- 4. Delete: Owners only
DROP POLICY IF EXISTS "Owners can delete rooms" ON public.rooms;
CREATE POLICY "Owners can delete rooms" ON public.rooms FOR DELETE
USING (
  auth.role() = 'authenticated' AND 
  EXISTS (SELECT 1 FROM public.hotels WHERE id = hotel_id AND owner_id = auth.uid())
);
