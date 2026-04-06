-- Add is_active column to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update RLS policies if needed (already public, but just in case)
-- COMMENT: Rooms are currently public viewable, so we should update the policies 
-- to potentially restrict view to only active rooms for non-admins.
-- However, we'll handle the filtering in the app layer for now as per the plan.

-- Log this change in audit logs for existing rooms (optional but good practice)
-- All existing rooms will have is_active = true by default.
