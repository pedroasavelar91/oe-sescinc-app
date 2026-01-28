-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cpf text unique not null,
  role text not null,
  email text unique not null,
  phone text,
  birth_date date,
  registration_date timestamp with time zone default now(),
  created_by uuid references public.users(id),
  base text,
  uniform_size jsonb,
  ppe_size jsonb,
  password text -- Storing plain/hashed password for custom auth simulation
);

-- Bases Table
create table public.bases (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  region text not null,
  airport_class text not null
);

-- Firefighters Table
create table public.firefighters (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  base text not null,
  region text not null,
  airport_class text not null,
  graduation_date date,
  last_update_date timestamp with time zone,
  is_not_updated boolean default false,
  last_fire_exercise_date date,
  is_away boolean default false,
  away_start_date date,
  away_end_date date,
  away_reason text
);

-- Subjects Table
create table public.subjects (
  id uuid primary key default uuid_generate_v4(),
  module text not null,
  name text not null,
  hours integer not null,
  modality text check (modality in ('Teórica', 'Prática'))
);

-- Courses Table
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null
);

-- Course Subjects Junction (Implicit in types.ts as subjects array in Course, but better normalized)
create table public.course_subjects (
  course_id uuid references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  primary key (course_id, subject_id)
);

-- Classes (ClassGroups) Table
create table public.classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date date,
  end_date date,
  course_id uuid references public.courses(id),
  days_of_week integer[],
  include_saturday boolean default false,
  include_sunday boolean default false,
  hours_per_day integer,
  theory_start_date date,
  practice_start_date date,
  registration_number text,
  cap_ba text,
  setup_instructor_1_id uuid references public.users(id),
  setup_instructor_1_days integer,
  setup_instructor_2_id uuid references public.users(id),
  setup_instructor_2_days integer,
  teardown_instructor_1_id uuid references public.users(id),
  teardown_instructor_1_days integer,
  teardown_instructor_2_id uuid references public.users(id),
  teardown_instructor_2_days integer
);

-- Students Table
create table public.students (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cpf text unique not null,
  class_id uuid references public.classes(id),
  enrollment_status text not null,
  rg text,
  rg_issuer text,
  birth_date date,
  phone text,
  email text,
  origin text,
  address text,
  nationality text,
  mother_name text,
  father_name text,
  grades jsonb,
  final_theory numeric,
  final_practical numeric,
  final_grade numeric
);

-- Tasks Table
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  start_date timestamp with time zone,
  deadline timestamp with time zone,
  creator_id uuid references public.users(id),
  assignee_id uuid references public.users(id),
  priority text check (priority in ('Baixa', 'Média', 'Alta')),
  status text check (status in ('Pendente', 'Aguardando Aprovação', 'Concluída')),
  comments jsonb
);

-- Notifications Table
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  title text not null,
  message text not null,
  type text not null,
  read boolean default false,
  timestamp timestamp with time zone default now(),
  metadata jsonb
);

-- Enable Row Level Security (RLS) - Optional but recommended
alter table public.users enable row level security;
alter table public.bases enable row level security;
alter table public.firefighters enable row level security;
alter table public.subjects enable row level security;
alter table public.courses enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;

-- Create policies (Open for all for now as requested for "deploy" without complex auth setup details)
create policy "Public access" on public.users for all using (true);
create policy "Public access" on public.bases for all using (true);
create policy "Public access" on public.firefighters for all using (true);
create policy "Public access" on public.subjects for all using (true);
create policy "Public access" on public.courses for all using (true);
create policy "Public access" on public.classes for all using (true);
create policy "Public access" on public.students for all using (true);
create policy "Public access" on public.tasks for all using (true);
create policy "Public access" on public.notifications for all using (true);