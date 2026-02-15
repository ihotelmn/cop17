-- Add columns for Google Reviews integration
ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS cached_rating DECIMAL(3, 1), -- e.g. 4.5
ADD COLUMN IF NOT EXISTS cached_review_count INTEGER;
