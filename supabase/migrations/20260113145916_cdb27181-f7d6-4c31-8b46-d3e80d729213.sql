-- Add missing columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
ADD COLUMN IF NOT EXISTS room TEXT,
ADD COLUMN IF NOT EXISTS meal_group TEXT DEFAULT 'M1';