-- Create attendance_reports table
CREATE TABLE public.attendance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('evening_study', 'boarding', 'meal')),
  session TEXT,
  meal_type TEXT CHECK (meal_type IS NULL OR meal_type IN ('breakfast', 'lunch', 'dinner')),
  class_id TEXT,
  total_students INTEGER NOT NULL DEFAULT 0,
  present_count INTEGER NOT NULL DEFAULT 0,
  absent_count INTEGER NOT NULL DEFAULT 0,
  absent_students JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  reporter_id UUID NOT NULL,
  reporter_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attendance_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view reports" 
ON public.attendance_reports 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create reports" 
ON public.attendance_reports 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reports" 
ON public.attendance_reports 
FOR UPDATE 
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can update any report" 
ON public.attendance_reports 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own reports" 
ON public.attendance_reports 
FOR DELETE 
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can delete any report" 
ON public.attendance_reports 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_attendance_reports_date ON public.attendance_reports(date);
CREATE INDEX idx_attendance_reports_type ON public.attendance_reports(type);
CREATE INDEX idx_attendance_reports_date_type ON public.attendance_reports(date, type);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_attendance_reports_updated_at
BEFORE UPDATE ON public.attendance_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();