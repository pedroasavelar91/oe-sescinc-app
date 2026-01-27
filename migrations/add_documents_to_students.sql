-- Add documents column to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS documents jsonb default '{}'::jsonb;
