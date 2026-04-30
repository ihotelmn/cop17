-- Performance indexes for high-traffic public pages (homepage, search, hotel detail).
-- Covers: hotels WHERE is_published = true ORDER BY created_at DESC
--         rooms WHERE hotel_id = ? AND is_active = true
--
-- Safe to re-run: all statements use IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_hotels_published_created
    ON public.hotels (is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rooms_hotel_active
    ON public.rooms (hotel_id)
    WHERE is_active = true;

-- Composite index to serve "admin bookings dashboard" queries that filter by
-- status and sort by created_at DESC together.
CREATE INDEX IF NOT EXISTS idx_bookings_status_created
    ON public.bookings (status, created_at DESC);
