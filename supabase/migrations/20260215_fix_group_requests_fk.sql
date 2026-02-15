-- Fix the foreign key for assigned_liaison_id to point to public.profiles instead of auth.users
-- This allows PostgREST (Supabase JS) to correctly perform joins for the admin dashboard.

ALTER TABLE group_requests 
DROP CONSTRAINT IF EXISTS group_requests_assigned_liaison_id_fkey;

ALTER TABLE group_requests
ADD CONSTRAINT group_requests_assigned_liaison_id_fkey 
FOREIGN KEY (assigned_liaison_id) 
REFERENCES public.profiles(id)
ON DELETE SET NULL;
