-- Fix users table schema to match the application code
-- Run this in your Supabase SQL Editor

-- Check current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- If birth_date doesn't exist, add it
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date date;

-- If birthdate exists instead, rename it
-- ALTER TABLE public.users RENAME COLUMN birthdate TO birth_date;

-- Ensure all required columns exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS registration_date date;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS uniform_size jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ppe_size jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS photo_url text;

-- Verify the schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
