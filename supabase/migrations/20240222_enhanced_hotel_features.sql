-- 1. Create Amenities Table
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for amenities
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Public amenities read" ON public.amenities FOR SELECT USING (true);

-- Allow authenticated users to insert new amenities
CREATE POLICY "Authenticated users insert amenities" ON public.amenities FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 2. Update Hotels Table
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS hotel_type TEXT DEFAULT 'Hotel',
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS check_in_time TIME DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS check_out_time TIME DEFAULT '12:00';


-- 3. Storage Bucket for Hotel Images
-- Note: Buckets are usually created via API or UI, but can be done via SQL if extension enabled
-- We'll try to insert into storage.buckets if it exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-images', 'hotel-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow public access to view
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'hotel-images' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'hotel-images' AND auth.role() = 'authenticated' );

-- Allow owners (or admins) to update/delete (Simplified to authenticated for now for ease)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'hotel-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'hotel-images' AND auth.role() = 'authenticated' );
