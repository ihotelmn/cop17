-- Drop existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;

-- Add new check constraint with 'super_admin'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'vip', 'guest'));

-- Initial Super Admin Setup (Assuming current user should be super_admin)
-- You might run this manually or I can include a snippet to update a specific email
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'your_email@example.com';
