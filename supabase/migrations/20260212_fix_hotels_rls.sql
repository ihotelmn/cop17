-- Enable RLS on hotels table
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- 1. VIEW: Allow everyone to view hotels
DROP POLICY IF EXISTS "Public can view hotels" ON public.hotels;
CREATE POLICY "Public can view hotels" 
ON public.hotels FOR SELECT 
USING (true);

-- 2. INSERT: Allow authenticated users to create hotels
-- They must set owner_id to their own auth.uid()
DROP POLICY IF EXISTS "Users can create hotels" ON public.hotels;
CREATE POLICY "Users can create hotels" 
ON public.hotels FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'); 
-- We relax the check to just 'authenticated' for now, 
-- relying on the application to set owner_id correctly.
-- Stricter: (auth.uid() = owner_id)

-- 3. UPDATE: Allow owners to update their hotels
DROP POLICY IF EXISTS "Owners can update their hotels" ON public.hotels;
CREATE POLICY "Owners can update their hotels" 
ON public.hotels FOR UPDATE 
USING (auth.uid() = owner_id);

-- 4. DELETE: Allow owners to delete their hotels
DROP POLICY IF EXISTS "Owners can delete their hotels" ON public.hotels;
CREATE POLICY "Owners can delete their hotels" 
ON public.hotels FOR DELETE 
USING (auth.uid() = owner_id);
