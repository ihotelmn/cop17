-- Add guest_name and guest_email to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email TEXT;
