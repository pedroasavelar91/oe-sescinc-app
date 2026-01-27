-- Add is_employee column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT false;

-- Add base_id column if it's missing (it was also in the mapper)
ALTER TABLE students
ADD COLUMN IF NOT EXISTS base_id TEXT REFERENCES bases(id);

-- Update the schema cache just in case
NOTIFY pgrst, 'reload schema';
