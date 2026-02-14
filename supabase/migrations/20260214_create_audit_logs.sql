-- Create Audit Logs Table
BEGIN;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,         -- e.g. 'CREATE_USER', 'DELETE_HOTEL'
  table_name TEXT,              -- e.g. 'users', 'hotels'
  record_id TEXT,               -- ID of the affected record
  changed_by UUID,              -- Who performed the action (can be null for system)
  old_data JSONB,               -- Snapshot before change
  new_data JSONB,               -- Snapshot after change
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Super Admins can view audit logs
DROP POLICY IF EXISTS "Super Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Super Admins can view audit logs" ON public.audit_logs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- 2. Service Role can insert (Admin Client bypasses RLS, but good to have explicit policy if needed)
-- Actually, since we use Admin Client (Service Role), RLS is bypassed for inserts anyway.
-- But we can allow authenticated users to insert if we want client-side logging (not recommended).
-- We'll keep it strict: Only Service Role inserts (implicitly allowed) 
-- or use a security definer function if needed.
-- For now, no INSERT policy means only Service Role/Super Admin can insert.

COMMIT;
