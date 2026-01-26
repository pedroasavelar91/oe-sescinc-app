-- Add is_active column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
