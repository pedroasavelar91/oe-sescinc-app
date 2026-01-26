-- Create class_photos table if it doesn't exist
-- Initial creation uses UUIDs, but we will alter them if referenced tables utilize TEXT
create table if not exists public.class_photos (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid, -- Will customize in DO block
  subject_id uuid, -- Will customize in DO block
  type text check (type in ('THEORY', 'PRACTICAL')),
  photo_url text not null,
  uploaded_by uuid, -- Will customize in DO block
  uploaded_by_name text,
  uploaded_at timestamp with time zone default now()
);

DO $$
BEGIN
    -- 1. Class ID Foreign Key Check & Adapt
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        ALTER TABLE public.class_photos ALTER COLUMN class_id TYPE text;
    ELSE
         -- Ensure it is UUID if it's not text (catch-all)
        ALTER TABLE public.class_photos ALTER COLUMN class_id TYPE uuid USING class_id::uuid;
    END IF;

    -- Apply FK for Class ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'class_photos_class_id_fkey') THEN
        ALTER TABLE public.class_photos ADD CONSTRAINT class_photos_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
    END IF;

    -- 2. Subject ID Foreign Key Check & Adapt
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        ALTER TABLE public.class_photos ALTER COLUMN subject_id TYPE text;
    ELSE
        ALTER TABLE public.class_photos ALTER COLUMN subject_id TYPE uuid USING subject_id::uuid;
    END IF;

    -- Apply FK for Subject ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'class_photos_subject_id_fkey') THEN
        ALTER TABLE public.class_photos ADD CONSTRAINT class_photos_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;

    -- 3. Uploaded By (User) Foreign Key Check & Adapt
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        ALTER TABLE public.class_photos ALTER COLUMN uploaded_by TYPE text;
    ELSE
        ALTER TABLE public.class_photos ALTER COLUMN uploaded_by TYPE uuid USING uploaded_by::uuid;
    END IF;

    -- Apply FK for Uploaded By
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'class_photos_uploaded_by_fkey') THEN
        ALTER TABLE public.class_photos ADD CONSTRAINT class_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);
    END IF;

END $$;

-- Enable RLS
alter table public.class_photos enable row level security;

-- Create policy
create policy "Public access" on public.class_photos for all using (true);
