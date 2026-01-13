-- Create table to store custom features/permission items
CREATE TABLE public.app_features (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    label text NOT NULL,
    description text,
    icon_name text DEFAULT 'Settings',
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can view active features, only admins can manage
CREATE POLICY "Anyone can view active features"
ON public.app_features
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all features"
ON public.app_features
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert features"
ON public.app_features
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update features"
ON public.app_features
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete features"
ON public.app_features
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default features
INSERT INTO public.app_features (code, label, description, icon_name, display_order) VALUES
('dashboard', 'Tổng quan', 'Xem tổng quan hệ thống', 'LayoutDashboard', 1),
('students', 'Quản lý học sinh', 'Quản lý danh sách học sinh theo lớp', 'Users', 2),
('evening_study', 'Điểm danh tự học', 'Điểm danh buổi tự học tối', 'BookOpen', 3),
('boarding', 'Điểm danh nội trú', 'Điểm danh học sinh nội trú', 'Home', 4),
('meals', 'Báo cáo bữa ăn', 'Quản lý và báo cáo bữa ăn', 'UtensilsCrossed', 5),
('statistics', 'Thống kê', 'Xem báo cáo thống kê', 'BarChart3', 6),
('statistics_study', 'Thống kê tự học', 'Xem thống kê điểm danh tự học', 'BookOpen', 7),
('statistics_boarding', 'Thống kê nội trú', 'Xem thống kê điểm danh nội trú', 'Home', 8),
('statistics_meals', 'Thống kê bữa ăn', 'Xem thống kê bữa ăn', 'UtensilsCrossed', 9),
('user_management', 'Quản lý tài khoản', 'Quản lý người dùng và phân quyền', 'UserCog', 10),
('settings', 'Cài đặt', 'Cấu hình hệ thống', 'Settings', 11);

-- Create trigger for updated_at
CREATE TRIGGER update_app_features_updated_at
BEFORE UPDATE ON public.app_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Alter user_permissions to use text instead of enum for flexibility
ALTER TABLE public.user_permissions 
ALTER COLUMN feature TYPE text USING feature::text;