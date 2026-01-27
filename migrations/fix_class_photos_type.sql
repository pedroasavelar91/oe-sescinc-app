-- Migration to fix class_photos schema to accept legacy text IDs
-- Run this in the Supabase SQL Editor

-- 1. Drop existing Foreign Key constraints to allow type change
DO $$
BEGIN
    -- Try to drop class_id FK
    BEGIN
        ALTER TABLE public.class_photos DROP CONSTRAINT IF EXISTS class_photos_class_id_fkey;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Try to drop subject_id FK
    BEGIN
        ALTER TABLE public.class_photos DROP CONSTRAINT IF EXISTS class_photos_subject_id_fkey;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 2. Change columns to TEXT to support both UUIDs and legacy short IDs
ALTER TABLE public.class_photos ALTER COLUMN class_id TYPE text;
ALTER TABLE public.class_photos ALTER COLUMN subject_id TYPE text;
-- Also ensure uploaded_by is text just in case (though should be uuid usually)
-- ALTER TABLE public.class_photos ALTER COLUMN uploaded_by TYPE text; 

-- 3. Re-establish Foreign Keys if possible (Only if referenced tables use TEXT)
-- We use a DO block to check types before adding constraints
DO $$
BEGIN
    -- Check if classes.id is text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        ALTER TABLE public.class_photos ADD CONSTRAINT class_photos_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
    END IF;

    -- Check if subjects.id is text AND subjects table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        ALTER TABLE public.class_photos ADD CONSTRAINT class_photos_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;
END $$;
