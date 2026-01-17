-- Fix 1: Restrict profiles table to own profile + admin access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Create a public view with limited fields for non-admin users who need basic user info
-- This is for duty schedules and other features that need to display user names
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, full_name
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;