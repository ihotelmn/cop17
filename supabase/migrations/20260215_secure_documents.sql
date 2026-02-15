-- Create documents table for tracking sensitive files
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES auth.users(id), -- Optional: if guest has an account
    type TEXT NOT NULL, -- 'passport', 'visa', 'accreditation'
    file_path TEXT NOT NULL, -- Path in storage bucket
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    notes TEXT
);

-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies for documents table
-- 1. Guests can view their own documents
CREATE POLICY "Guests can view own documents" 
ON documents FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = documents.booking_id 
        AND bookings.user_id = auth.uid()
    ) OR guest_id = auth.uid()
);

-- 2. Guests can insert their own documents
CREATE POLICY "Guests can insert own documents" 
ON documents FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = booking_id 
        AND bookings.user_id = auth.uid()
    ) OR guest_id = auth.uid()
);

-- 3. Admins/Liaisons can view and update all documents
CREATE POLICY "Admins can manage all documents" 
ON documents FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'super_admin', 'liaison')
    )
);

-- STORAGE CONFIGURATION (Hypothetical, usually done via Supabase dashboard or API)
-- Note: Creating bucket and storage policies in SQL
-- Reference: https://supabase.com/docs/guides/storage/security/access-control

/*
INSERT INTO storage.buckets (id, name, public) 
VALUES ('accreditation-docs', 'accreditation-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Guest Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'accreditation-docs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin Access"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'accreditation-docs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin', 'liaison')
  )
);
*/
