-- Create duty_schedules table
CREATE TABLE public.duty_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  teacher_name TEXT NOT NULL,
  duty_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_name, duty_date)
);

-- Enable RLS
ALTER TABLE public.duty_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view duty schedules
CREATE POLICY "Authenticated users can view duty schedules"
ON public.duty_schedules
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admin can manage all duty schedules
CREATE POLICY "Admin can manage duty schedules"
ON public.duty_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy: Boarding management group can manage duty schedules
CREATE POLICY "Boarding management can manage duty schedules"
ON public.duty_schedules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_permission_groups upg
    JOIN public.permission_groups pg ON upg.group_id = pg.id
    WHERE upg.user_id = auth.uid() 
    AND pg.name = 'Quản lí nội trú'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_permission_groups upg
    JOIN public.permission_groups pg ON upg.group_id = pg.id
    WHERE upg.user_id = auth.uid() 
    AND pg.name = 'Quản lí nội trú'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_duty_schedules_updated_at
BEFORE UPDATE ON public.duty_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();