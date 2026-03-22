ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_fee NUMERIC NOT NULL DEFAULT 0;

UPDATE public.bookings
SET service_fee = 0
WHERE service_fee IS NULL;
