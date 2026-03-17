BEGIN;

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (
    status IN (
        'pending',
        'prebook_requested',
        'confirmed',
        'cancelled',
        'completed',
        'paid',
        'blocked'
    )
);

DROP INDEX IF EXISTS idx_bookings_active_overlap_window;

CREATE INDEX IF NOT EXISTS idx_bookings_active_overlap_window
    ON public.bookings(room_id, check_in_date, check_out_date, created_at)
    WHERE status IN ('pending', 'prebook_requested', 'confirmed', 'paid', 'blocked');

COMMIT;
