ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

UPDATE public.hotels
SET is_published = TRUE
WHERE is_published IS NULL;

ALTER TABLE public.hotels
ALTER COLUMN is_published SET NOT NULL;
