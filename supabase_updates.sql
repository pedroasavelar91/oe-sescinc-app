-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. New Tables for Persistence & Features

-- Attendance Logs
create table if not exists public.attendance_logs (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id),
  date date,
  time text,
  timestamp timestamp with time zone default now(),
  taken_by_id uuid references public.users(id),
  taken_by_name text,
  notes text,
  records jsonb -- Array of { studentId, status, time }
);

-- Grade Logs
create table if not exists public.grade_logs (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id),
  timestamp timestamp with time zone default now(),
  user_id uuid references public.users(id),
  user_name text,
  details text
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  schedule_item_id text, -- Can be null if manual payment
  instructor_id uuid references public.users(id),
  amount numeric,
  date_paid date,
  paid_by text
);

-- Checklist Templates
create table if not exists public.checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  type text, -- 'viatura', 'ambulancia', 'equipamento'
  title text,
  items jsonb -- Array of item definitions
);

-- Checklist Logs
create table if not exists public.checklist_logs (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references public.checklist_templates(id),
  type text,
  date date,
  timestamp timestamp with time zone default now(),
  user_id uuid references public.users(id),
  user_name text,
  class_id uuid references public.classes(id), -- Optional
  stage text, -- 'INICIO', 'TERMINO'
  items jsonb, -- Array of results
  is_compliant boolean,
  notes text
);

-- Swap Requests (Substitutions)
create table if not exists public.swap_requests (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid references public.users(id),
  requester_name text,
  target_instructor_id uuid references public.users(id),
  target_instructor_name text,
  class_id uuid references public.classes(id),
  class_name text,
  schedule_id text,
  date date,
  time text,
  status text check (status in ('Pendente', 'Aceito', 'Recusado')),
  timestamp timestamp with time zone default now()
);

-- Firefighter Logs
create table if not exists public.firefighter_logs (
  id uuid primary key default uuid_generate_v4(),
  firefighter_id uuid references public.firefighters(id),
  firefighter_name text,
  timestamp timestamp with time zone default now(),
  user_id uuid references public.users(id),
  user_name text,
  details text
);

-- Document Management (Folders & Documents)
create table if not exists public.folders (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  parent_id uuid references public.folders(id),
  allowed_roles text[], -- Array of strings e.g. ['Motorista', 'Instrutor']
  created_by uuid references public.users(id),
  created_at timestamp with time zone default now()
);

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  folder_id uuid references public.folders(id),
  name text not null,
  url text not null,
  type text, -- 'pdf', 'docx', etc.
  size text,
  uploaded_by uuid references public.users(id),
  uploaded_at timestamp with time zone default now()
);

-- 2. Schema Updates for Existing Tables

-- Add photo_url to users
alter table public.users add column if not exists photo_url text;

-- 3. RLS Policies (Open Access for simplicity as requested)

alter table public.attendance_logs enable row level security;
create policy "Public access" on public.attendance_logs for all using (true);

alter table public.grade_logs enable row level security;
create policy "Public access" on public.grade_logs for all using (true);

alter table public.payments enable row level security;
create policy "Public access" on public.payments for all using (true);

alter table public.checklist_templates enable row level security;
create policy "Public access" on public.checklist_templates for all using (true);

alter table public.checklist_logs enable row level security;
create policy "Public access" on public.checklist_logs for all using (true);

alter table public.swap_requests enable row level security;
create policy "Public access" on public.swap_requests for all using (true);

alter table public.firefighter_logs enable row level security;
create policy "Public access" on public.firefighter_logs for all using (true);

alter table public.folders enable row level security;
create policy "Public access" on public.folders for all using (true);

alter table public.documents enable row level security;
create policy "Public access" on public.documents for all using (true);

-- Setup/Teardown Assignments
create table if not exists public.setup_teardown_assignments (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id),
  class_name text,
  type text check (type in ('Montagem', 'Desmontagem')),
  instructor_id uuid references public.users(id),
  instructor_name text,
  days integer,
  rate numeric default 350,
  total_value numeric,
  date date,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.setup_teardown_assignments enable row level security;
create policy "Public access" on public.setup_teardown_assignments for all using (true);
