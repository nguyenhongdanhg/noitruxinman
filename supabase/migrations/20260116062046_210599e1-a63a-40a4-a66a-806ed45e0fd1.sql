-- Tạo bảng nhóm quyền
CREATE TABLE public.permission_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tạo bảng liên kết nhóm quyền với các quyền cụ thể
CREATE TABLE public.permission_group_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.permission_groups(id) ON DELETE CASCADE NOT NULL,
    feature_code TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_create BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (group_id, feature_code)
);

-- Tạo bảng liên kết người dùng với nhóm quyền
CREATE TABLE public.user_permission_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES public.permission_groups(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, group_id)
);

-- Enable RLS
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies cho permission_groups
CREATE POLICY "Admins can manage permission groups"
ON public.permission_groups
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view permission groups"
ON public.permission_groups
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies cho permission_group_permissions
CREATE POLICY "Admins can manage group permissions"
ON public.permission_group_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view group permissions"
ON public.permission_group_permissions
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies cho user_permission_groups
CREATE POLICY "Admins can manage user group assignments"
ON public.user_permission_groups
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own group assignments"
ON public.user_permission_groups
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Trigger cập nhật updated_at
CREATE TRIGGER update_permission_groups_updated_at
BEFORE UPDATE ON public.permission_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();