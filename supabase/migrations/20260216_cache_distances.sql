-- Add columns to cache distance and travel time from Venue
ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS cached_distance_km DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS cached_drive_time_text TEXT,
ADD COLUMN IF NOT EXISTS cached_drive_time_value INTEGER, -- seconds
ADD COLUMN IF NOT EXISTS cached_walk_time_text TEXT,
ADD COLUMN IF NOT EXISTS cached_walk_time_value INTEGER; -- seconds
