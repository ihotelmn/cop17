-- Migration: Enrich Schema for Guest Experience
-- Description: Adds columns to hotels and rooms to support rich content from ihotel.mn
-- Author: Antigravity

BEGIN;

-- 1. Hotels Enrichment
-- Additional fields for better guest information and SEO
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE, -- Useful for SEO friendly URLs
ADD COLUMN IF NOT EXISTS star_rating INTEGER DEFAULT 0, -- 1-5 stars
ADD COLUMN IF NOT EXISTS district_id INTEGER; -- To map to ihotel's districts later

-- Add index for slug lookup as it will be used in URLs
CREATE INDEX IF NOT EXISTS idx_hotels_slug ON public.hotels(slug);

-- 2. Rooms Enrichment
-- Detailed room info
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS size_sqm NUMERIC, -- Room size in square meters
ADD COLUMN IF NOT EXISTS bed_config TEXT, -- Description of beds (e.g., "1 King Bed")
ADD COLUMN IF NOT EXISTS max_adults INTEGER DEFAULT 2, -- Maximum adults capacity
ADD COLUMN IF NOT EXISTS max_children INTEGER DEFAULT 0; -- Maximum children capacity

-- 3. Room Facilities / Amenities (Already exists as TEXT[], but let's ensure comment)
COMMENT ON COLUMN public.rooms.amenities IS 'Array of amenity names or IDs';

-- 4. Hotel Facilities / Amenities (Ensure column exists if needed, often stored in jsonb or separate table)
-- If not exists, adding amenities array to hotels too for high-level amenities (Pool, Gym)
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS amenities TEXT[];

COMMIT;
