-- Function to allow inserting pre-hashed passwords from the trans_api export
-- This needs to run with security definer to bypass RLS
CREATE OR REPLACE FUNCTION import_legacy_user(
  p_id UUID,
  p_email TEXT,
  p_hashed_password TEXT,
  p_name TEXT,
  p_created_time TIMESTAMPTZ,
  p_updated_time TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  -- Insert into auth.users with the legacy bcrypt hash
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    email_confirmed_at
  ) VALUES (
    p_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    p_hashed_password,
    jsonb_build_object('full_name', p_name),
    'authenticated',
    'authenticated',
    p_created_time,
    p_updated_time,
    '',
    p_created_time
  );
EXCEPTION WHEN unique_violation THEN
  -- Do nothing if user already exists
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
