-- Create training_schedules table if it doesn't exist
create table if not exists public.training_schedules (
  id uuid primary key default uuid_generate_v4(),
  class_name text,
  origin text,
  destination text,
  medtruck_displacement_start text,
  medtruck_displacement_end text,
  setup_date date,
  teardown_date date,
  theory_start text, -- Storing as text to match typescript string format (or change to timestamp/time if preferred)
  theory_end text,
  theory_student_count integer default 0,
  practice_start text,
  practice_end text,
  practice_student_count integer default 0,
  student_locality text,
  location text,
  student_breakdown jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.training_schedules enable row level security;

-- Create policy
create policy "Public access" on public.training_schedules for all using (true);
