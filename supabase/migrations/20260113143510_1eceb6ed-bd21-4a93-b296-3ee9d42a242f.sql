-- Create students table
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    class_id TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('Nam', 'Nữ')),
    parent_phone TEXT,
    address TEXT,
    is_boarding BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view students
CREATE POLICY "Authenticated users can view students"
ON public.students FOR SELECT
TO authenticated
USING (true);

-- Admin can do everything
CREATE POLICY "Admin can insert students"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update students"
ON public.students FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete students"
ON public.students FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Class teachers can manage students in their class
CREATE POLICY "Class teacher can insert students in their class"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'class_teacher') AND
    public.is_class_teacher(auth.uid(), class_id)
);

CREATE POLICY "Class teacher can update students in their class"
ON public.students FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'class_teacher') AND
    public.is_class_teacher(auth.uid(), class_id)
);

CREATE POLICY "Class teacher can delete students in their class"
ON public.students FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'class_teacher') AND
    public.is_class_teacher(auth.uid(), class_id)
);

-- Trigger for updated_at
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();