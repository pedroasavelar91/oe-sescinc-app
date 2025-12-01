-- ============================================
-- COMPLETE SUPABASE SCHEMA RESET
-- ============================================
-- This script will DROP all existing tables and recreate them
-- WARNING: This will DELETE ALL DATA!
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP ALL EXISTING TABLES (in correct order due to foreign keys)
-- ============================================

DROP TABLE IF EXISTS public.setup_teardown_assignments CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.firefighter_logs CASCADE;
DROP TABLE IF EXISTS public.swap_requests CASCADE;
DROP TABLE IF EXISTS public.checklist_logs CASCADE;
DROP TABLE IF EXISTS public.checklist_templates CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.grade_logs CASCADE;
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.firefighters CASCADE;
DROP TABLE IF EXISTS public.bases CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- ============================================
-- CREATE TABLES WITH CORRECT SCHEMA
-- ============================================

-- USERS TABLE
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  registration_date DATE,
  created_by TEXT,
  base TEXT,
  uniform_size JSONB,
  ppe_size JSONB,
  photo_url TEXT,
  password TEXT
);

-- COURSES TABLE
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subjects JSONB
);

-- CLASSES TABLE
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  course_id UUID REFERENCES public.courses(id),
  student_ids UUID[],
  days_of_week INTEGER[],
  include_saturday BOOLEAN DEFAULT false,
  include_sunday BOOLEAN DEFAULT false,
  hours_per_day NUMERIC,
  theory_start_date DATE,
  practice_start_date DATE,
  registration_number TEXT,
  cap_ba TEXT,
  subjects JSONB
);

-- STUDENTS TABLE
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  class_id UUID REFERENCES public.classes(id),
  enrollment_status TEXT,
  rg TEXT,
  rg_issuer TEXT,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  origin TEXT,
  address TEXT,
  nationality TEXT,
  mother_name TEXT,
  father_name TEXT,
  matricula TEXT,
  registro TEXT,
  cap_code TEXT,
  class_name TEXT,
  grades JSONB,
  final_theory NUMERIC,
  final_practical NUMERIC,
  final_grade NUMERIC
);

-- TASKS TABLE
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  deadline DATE,
  creator_id UUID REFERENCES public.users(id),
  assignee_id UUID REFERENCES public.users(id),
  priority TEXT,
  status TEXT,
  comments JSONB
);

-- ATTENDANCE LOGS TABLE
CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES public.classes(id),
  date DATE,
  time TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  taken_by_id UUID REFERENCES public.users(id),
  taken_by_name TEXT,
  notes TEXT,
  records JSONB
);

-- GRADE LOGS TABLE
CREATE TABLE public.grade_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES public.classes(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id),
  user_name TEXT,
  details TEXT
);

-- PAYMENTS TABLE
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_item_id TEXT,
  instructor_id UUID REFERENCES public.users(id),
  amount NUMERIC,
  date_paid DATE,
  paid_by TEXT
);

-- CHECKLIST TEMPLATES TABLE
CREATE TABLE public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT,
  title TEXT,
  items JSONB
);

-- CHECKLIST LOGS TABLE
CREATE TABLE public.checklist_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.checklist_templates(id),
  type TEXT,
  date DATE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id),
  user_name TEXT,
  class_id UUID REFERENCES public.classes(id),
  stage TEXT,
  items JSONB,
  is_compliant BOOLEAN,
  notes TEXT
);

-- NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  title TEXT,
  message TEXT,
  type TEXT,
  read BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- SWAP REQUESTS TABLE
CREATE TABLE public.swap_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES public.users(id),
  requester_name TEXT,
  target_instructor_id UUID REFERENCES public.users(id),
  target_instructor_name TEXT,
  class_id UUID REFERENCES public.classes(id),
  class_name TEXT,
  schedule_id TEXT,
  date DATE,
  time TEXT,
  status TEXT CHECK (status IN ('Pendente', 'Aceito', 'Recusado')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BASES TABLE
CREATE TABLE public.bases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  region TEXT,
  airport_class TEXT
);

-- FIREFIGHTERS TABLE
CREATE TABLE public.firefighters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  rg TEXT,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  base_id UUID REFERENCES public.bases(id),
  registration_date DATE,
  status TEXT
);

-- FIREFIGHTER LOGS TABLE
CREATE TABLE public.firefighter_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firefighter_id UUID REFERENCES public.firefighters(id),
  firefighter_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id),
  user_name TEXT,
  details TEXT
);

-- FOLDERS TABLE
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id),
  allowed_roles TEXT[],
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DOCUMENTS TABLE
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID REFERENCES public.folders(id),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SETUP/TEARDOWN ASSIGNMENTS TABLE
CREATE TABLE public.setup_teardown_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES public.classes(id),
  class_name TEXT,
  type TEXT CHECK (type IN ('Montagem', 'Desmontagem')),
  instructor_id UUID REFERENCES public.users(id),
  instructor_name TEXT,
  days INTEGER,
  rate NUMERIC DEFAULT 350,
  total_value NUMERIC,
  date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.users FOR ALL USING (true);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.courses FOR ALL USING (true);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.classes FOR ALL USING (true);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.students FOR ALL USING (true);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.tasks FOR ALL USING (true);

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.attendance_logs FOR ALL USING (true);

ALTER TABLE public.grade_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.grade_logs FOR ALL USING (true);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.payments FOR ALL USING (true);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.checklist_templates FOR ALL USING (true);

ALTER TABLE public.checklist_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.checklist_logs FOR ALL USING (true);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.notifications FOR ALL USING (true);

ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.swap_requests FOR ALL USING (true);

ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.bases FOR ALL USING (true);

ALTER TABLE public.firefighters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.firefighters FOR ALL USING (true);

ALTER TABLE public.firefighter_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.firefighter_logs FOR ALL USING (true);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.folders FOR ALL USING (true);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.documents FOR ALL USING (true);

ALTER TABLE public.setup_teardown_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.setup_teardown_assignments FOR ALL USING (true);

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Create profile-photos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to buckets
CREATE POLICY "Public access to profile photos"
ON storage.objects FOR ALL
USING (bucket_id = 'profile-photos');

CREATE POLICY "Public access to documents"
ON storage.objects FOR ALL
USING (bucket_id = 'documents');

-- ============================================
-- DONE!
-- ============================================
-- All tables have been recreated with the correct schema
-- You can now use the application and data will persist correctly
