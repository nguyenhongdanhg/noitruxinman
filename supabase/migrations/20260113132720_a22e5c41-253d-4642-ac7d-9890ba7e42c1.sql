-- Create enum for features/permissions
CREATE TYPE public.app_feature AS ENUM (
  'dashboard',
  'students', 
  'evening_study',
  'boarding',
  'meals',
  'statistics',
  'user_management',
  'settings'
);

-- Create user_permissions table for granular feature access
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature app_feature NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all permissions"
ON public.user_permissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert permissions"
ON public.user_permissions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update permissions"
ON public.user_permissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete permissions"
ON public.user_permissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own permissions"
ON public.user_permissions
FOR SELECT
USING (user_id = auth.uid());

-- Function to check if user has permission for a feature
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id UUID, 
  _feature app_feature, 
  _action TEXT DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND feature = _feature
      AND (
        (_action = 'view' AND can_view = true) OR
        (_action = 'create' AND can_create = true) OR
        (_action = 'edit' AND can_edit = true) OR
        (_action = 'delete' AND can_delete = true)
      )
  )
$$;

-- Trigger for updated_at
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();