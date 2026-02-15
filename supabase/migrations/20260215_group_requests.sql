-- Create group_requests table
CREATE TABLE IF NOT EXISTS group_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    organization_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    guest_count INTEGER NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    preferred_hotel TEXT,
    budget_range TEXT,
    special_requirements TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
    assigned_liaison_id UUID REFERENCES auth.users(id),
    notes TEXT
);

-- Add enhancements to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_request_id UUID REFERENCES group_requests(id);

-- Enable RLS
ALTER TABLE group_requests ENABLE ROW LEVEL SECURITY;

-- Policies for group_requests

-- Allow anyone to submit a request (public submission)
CREATE POLICY "Anyone can create group requests" 
ON group_requests FOR INSERT 
WITH CHECK (true);

-- Allow admins to view all requests
CREATE POLICY "Admins can view all group requests" 
ON group_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin', 'liaison')
  )
);

-- Allow admins to update requests
CREATE POLICY "Admins can update group requests" 
ON group_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin', 'liaison')
  )
);

-- Grant permissions for authenticated and anon users since it's a public form
GRANT INSERT ON group_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON group_requests TO authenticated; -- restricted by RLS
