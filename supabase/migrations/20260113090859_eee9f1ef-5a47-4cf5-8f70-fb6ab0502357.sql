-- Add username column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Create function to get email by username or phone
CREATE OR REPLACE FUNCTION public.get_email_by_login(login_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- First try to find by username
  SELECT u.email INTO user_email
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE p.username = login_input;
  
  IF user_email IS NOT NULL THEN
    RETURN user_email;
  END IF;
  
  -- Then try to find by phone
  SELECT u.email INTO user_email
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE p.phone = login_input;
  
  RETURN user_email;
END;
$$;