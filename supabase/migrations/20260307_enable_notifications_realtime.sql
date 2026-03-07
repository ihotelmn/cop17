-- Enable Realtime for notifications table
-- This allows the NotificationBell component to receive live updates when a new notification is inserted
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
