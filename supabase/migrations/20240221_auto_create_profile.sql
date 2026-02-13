-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, organization)
  VALUES (
    NEW.id,
    NEW.email,
    -- Try to get full_name from metadata, else default to null or email logic
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Guest User'),
    -- Try to get role from metadata (for admin creation), else default to 'guest'
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest'),
    NEW.raw_user_meta_data->>'organization'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
