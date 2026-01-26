-- Create questions table if it doesn't exist
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  title text,
  subject text not null,
  content text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option text check (correct_option in ('A', 'B', 'C', 'D')),
  explanation text,
  created_by uuid, -- Will enforce FK in DO block
  created_by_name text,
  created_at timestamp with time zone default now(),
  status text default 'Pendente',
  reviewer_id uuid, -- Will enforce FK in DO block
  reviewer_name text,
  reviewed_at timestamp with time zone,
  review_notes text,
  times_used integer default 0,
  valid_until timestamp with time zone
);

create table if not exists public.question_reviews (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions(id) on delete cascade,
  reviewer_id uuid, -- Will enforce FK
  reviewer_name text,
  timestamp timestamp with time zone default now(),
  action text,
  notes text
);

create table if not exists public.question_approvers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid, -- Will enforce FK
  user_name text,
  assigned_by uuid, -- Will enforce FK
  assigned_by_name text,
  assigned_at timestamp with time zone default now(),
  is_active boolean default true
);

DO $$
BEGIN
    -- Handle Users FKs (created_by, reviewer_id, user_id, assigned_by)
    -- Check if users.id is TEXT or UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'text'
    ) THEN
        -- Convert columns to TEXT if Users ID is TEXT
        ALTER TABLE public.questions ALTER COLUMN created_by TYPE text;
        ALTER TABLE public.questions ALTER COLUMN reviewer_id TYPE text;
        ALTER TABLE public.question_reviews ALTER COLUMN reviewer_id TYPE text;
        ALTER TABLE public.question_approvers ALTER COLUMN user_id TYPE text;
        ALTER TABLE public.question_approvers ALTER COLUMN assigned_by TYPE text;
    END IF;

    -- Add Constraints (If they don't exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'questions_created_by_fkey') THEN
        ALTER TABLE public.questions ADD CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'questions_reviewer_id_fkey') THEN
        ALTER TABLE public.questions ADD CONSTRAINT questions_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'question_reviews_reviewer_id_fkey') THEN
        ALTER TABLE public.question_reviews ADD CONSTRAINT question_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'question_approvers_user_id_fkey') THEN
        ALTER TABLE public.question_approvers ADD CONSTRAINT question_approvers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'question_approvers_assigned_by_fkey') THEN
        ALTER TABLE public.question_approvers ADD CONSTRAINT question_approvers_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);
    END IF;

END $$;

-- Enable RLS
alter table public.questions enable row level security;
alter table public.question_reviews enable row level security;
alter table public.question_approvers enable row level security;

-- Create policies
create policy "Public access" on public.questions for all using (true);
create policy "Public access" on public.question_reviews for all using (true);
create policy "Public access" on public.question_approvers for all using (true);
