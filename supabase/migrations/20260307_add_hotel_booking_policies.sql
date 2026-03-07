BEGIN;

ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS free_cancellation_window_hours INTEGER NOT NULL DEFAULT 168,
ADD COLUMN IF NOT EXISTS partial_cancellation_window_hours INTEGER NOT NULL DEFAULT 48,
ADD COLUMN IF NOT EXISTS partial_cancellation_penalty_percent INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS late_cancellation_penalty_percent INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS modification_cutoff_hours INTEGER NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS cancellation_policy_notes TEXT;

DO $$
BEGIN
    ALTER TABLE public.hotels
    ADD CONSTRAINT hotels_cancellation_windows_check
    CHECK (
        free_cancellation_window_hours >= 0
        AND partial_cancellation_window_hours >= 0
        AND modification_cutoff_hours >= 0
        AND free_cancellation_window_hours >= partial_cancellation_window_hours
        AND partial_cancellation_penalty_percent BETWEEN 0 AND 100
        AND late_cancellation_penalty_percent BETWEEN 0 AND 100
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_penalty_percent INTEGER,
ADD COLUMN IF NOT EXISTS cancellation_penalty_amount NUMERIC(10, 2);

DO $$
BEGIN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_cancellation_penalty_check
    CHECK (
        cancellation_penalty_percent IS NULL
        OR cancellation_penalty_percent BETWEEN 0 AND 100
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_cancellation_amount_check
    CHECK (
        cancellation_penalty_amount IS NULL
        OR cancellation_penalty_amount >= 0
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
