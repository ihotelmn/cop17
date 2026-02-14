-- Optimizing Database Performance with Indexes

-- 1. Bookings Table
-- Filter by status is common for dashboard and lists
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
-- Sort by created_at is default
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- 2. Rooms Table
-- Join with hotels is common
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON public.rooms(hotel_id);

-- 3. Hotels Table
-- Filter by owner_id to get user's hotels
CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON public.hotels(owner_id);

-- 4. Notifications Table
-- Sort by created_at common for feeds
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
