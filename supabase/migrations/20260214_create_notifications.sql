-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'booking_new', -- 'booking_new', 'system', etc.
    link TEXT, -- Internal link to redirect to
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Users can mark their own notifications as read (update)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Service role can do everything (for server actions to insert)
-- Implicit in Supabase service role, but good to be clear if needed.
-- Creating explicit policy for service role isn't strictly necessary as service role bypasses RLS,
-- but helpful for clarity or if we use a restricted role later.
-- For now, relying on service role bypass.

-- Grant permissions
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- Create index for faster queries by user and read status
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
