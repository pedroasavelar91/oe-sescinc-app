-- Add cpf column to firefighters table if it doesn't exist
ALTER TABLE public.firefighters ADD COLUMN IF NOT EXISTS cpf text DEFAULT '';
