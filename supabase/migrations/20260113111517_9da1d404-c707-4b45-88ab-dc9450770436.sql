-- Create login_history table
CREATE TABLE public.login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all login history
CREATE POLICY "Admins can view all login history" 
ON public.login_history 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own login history
CREATE POLICY "Users can view own login history" 
ON public.login_history 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Any authenticated user can insert their own login history
CREATE POLICY "Users can insert own login history" 
ON public.login_history 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_login_at ON public.login_history(login_at DESC);