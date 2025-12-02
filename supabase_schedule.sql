-- Create table for Training Schedules (Cronograma)
create table public.training_schedules (
  id uuid not null default gen_random_uuid (),
  class_name text not null,
  origin text null,
  destination text null,
  medtruck_displacement_start timestamp with time zone null,
  medtruck_displacement_end timestamp with time zone null,
  setup_date date null,
  teardown_date date null,
  theory_start timestamp with time zone null,
  theory_end timestamp with time zone null,
  theory_student_count integer null,
  practice_start timestamp with time zone null,
  practice_end timestamp with time zone null,
  practice_student_count integer null,
  student_locality text null,
  location text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  constraint training_schedules_pkey primary key (id)
);

-- Enable RLS
alter table public.training_schedules enable row level security;

-- Create policies
create policy "Enable read access for authenticated users" on public.training_schedules as permissive for select to authenticated using (true);

create policy "Enable insert for authenticated users" on public.training_schedules as permissive for insert to authenticated with check (true);

create policy "Enable update for authenticated users" on public.training_schedules as permissive for update to authenticated using (true);

create policy "Enable delete for authenticated users" on public.training_schedules as permissive for delete to authenticated using (true);
