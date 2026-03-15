BEGIN;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS modification_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS modification_request_message TEXT,
ADD COLUMN IF NOT EXISTS modification_request_status TEXT,
ADD COLUMN IF NOT EXISTS modification_reviewed_at TIMESTAMPTZ;

DO $$
BEGIN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_modification_request_status_check
    CHECK (
        modification_request_status IS NULL
        OR modification_request_status IN ('pending', 'reviewed', 'resolved')
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'bookings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    END IF;
END $$;

UPDATE public.notifications
SET link = regexp_replace(link, '^/admin/bookings/([0-9a-fA-F-]+)$', '/admin/bookings?search=\1')
WHERE type IN ('booking_cancelled', 'booking_modification')
  AND link ~ '^/admin/bookings/[0-9a-fA-F-]+$';

WITH latest_modification_notifications AS (
    SELECT DISTINCT ON (booking_id)
        booking_id,
        created_at,
        message
    FROM (
        SELECT
            CASE
                WHEN link LIKE '/admin/bookings/%' THEN replace(link, '/admin/bookings/', '')
                WHEN link LIKE '/admin/bookings?search=%' THEN split_part(link, 'search=', 2)
                ELSE NULL
            END AS booking_id,
            created_at,
            message
        FROM public.notifications
        WHERE type = 'booking_modification'
    ) notification_matches
    WHERE booking_id IS NOT NULL
    ORDER BY booking_id, created_at DESC
)
UPDATE public.bookings AS booking
SET modification_requested_at = latest.created_at,
    modification_request_message = regexp_replace(latest.message, '^Guest requested changes for booking at .*?:\\s*', ''),
    modification_request_status = COALESCE(booking.modification_request_status, 'pending')
FROM latest_modification_notifications AS latest
WHERE booking.id::text = latest.booking_id
  AND booking.modification_requested_at IS NULL;

COMMIT;
