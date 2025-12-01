-- ============================================
-- SUPABASE COMPLETE RESET SCRIPT
-- ============================================
-- ATENÇÃO: ESTE SCRIPT APAGARÁ TODOS OS DADOS!
-- Ele recria o banco de dados do zero para garantir compatibilidade total.
-- ============================================

-- 1. DROP ALL TABLES (Limpeza)
DROP TABLE IF EXISTS public.setup_teardown_assignments CASCADE;
DROP TABLE IF EXISTS public.firefighter_logs CASCADE;
DROP TABLE IF EXISTS public.firefighters CASCADE;
DROP TABLE IF EXISTS public.bases CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.swap_requests CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.checklist_logs CASCADE;
DROP TABLE IF EXISTS public.checklist_templates CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.grade_logs CASCADE;
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. CREATE TABLES (Recriação)

-- USERS
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    registration_date TEXT NOT NULL,
    created_by TEXT NOT NULL,
    base TEXT,
    uniform_size JSONB, -- { jumpsuit, shoes, shirt }
    ppe_size JSONB,     -- { pants, jacket, gloves, boots }
    photo_url TEXT,
    password TEXT
);

-- COURSES
CREATE TABLE public.courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subjects JSONB DEFAULT '[]'::jsonb -- Array of Subject objects
);

-- CLASSES
CREATE TABLE public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    course_id TEXT NOT NULL, -- Link lógico, sem FK estrita para evitar erros de ordem
    student_ids JSONB DEFAULT '[]'::jsonb, -- Array of strings
    days_of_week JSONB DEFAULT '[]'::jsonb, -- Array of numbers
    include_weekends BOOLEAN DEFAULT false,
    include_saturday BOOLEAN DEFAULT false,
    include_sunday BOOLEAN DEFAULT false,
    hours_per_day INTEGER DEFAULT 8,
    theory_start_date TEXT,
    practice_start_date TEXT,
    registration_number TEXT,
    cap_ba TEXT,
    schedule JSONB DEFAULT '[]'::jsonb, -- Array of ClassScheduleItem
    
    -- Setup/Teardown fields
    setup_instructor_1_id TEXT,
    setup_instructor_1_days INTEGER DEFAULT 0,
    setup_instructor_2_id TEXT,
    setup_instructor_2_days INTEGER DEFAULT 0,
    teardown_instructor_1_id TEXT,
    teardown_instructor_1_days INTEGER DEFAULT 0,
    teardown_instructor_2_id TEXT,
    teardown_instructor_2_days INTEGER DEFAULT 0
);

-- STUDENTS
CREATE TABLE public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    class_id TEXT,
    enrollment_status TEXT NOT NULL,
    rg TEXT NOT NULL,
    rg_issuer TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    origin TEXT NOT NULL,
    address TEXT NOT NULL,
    nationality TEXT NOT NULL,
    mother_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    matricula TEXT,
    registro TEXT,
    cap_code TEXT,
    class_name TEXT,
    grades JSONB DEFAULT '{}'::jsonb,
    final_theory NUMERIC DEFAULT 0,
    final_practical NUMERIC DEFAULT 0,
    final_grade NUMERIC DEFAULT 0
);

-- TASKS
CREATE TABLE public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date TEXT NOT NULL,
    deadline TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    assignee_id TEXT,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    comments JSONB DEFAULT '[]'::jsonb
);

-- ATTENDANCE LOGS
CREATE TABLE public.attendance_logs (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    taken_by_id TEXT NOT NULL,
    taken_by_name TEXT NOT NULL,
    notes TEXT,
    records JSONB DEFAULT '[]'::jsonb -- Array of AttendanceRecord
);

-- GRADE LOGS
CREATE TABLE public.grade_logs (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    details TEXT NOT NULL
);

-- PAYMENTS
CREATE TABLE public.payments (
    id TEXT PRIMARY KEY,
    schedule_item_id TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date_paid TEXT NOT NULL,
    paid_by TEXT NOT NULL
);

-- CHECKLIST TEMPLATES
CREATE TABLE public.checklist_templates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb
);

-- CHECKLIST LOGS
CREATE TABLE public.checklist_logs (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    class_id TEXT,
    stage TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    is_compliant BOOLEAN DEFAULT false,
    notes TEXT
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    timestamp TEXT NOT NULL,
    metadata JSONB
);

-- SWAP REQUESTS
CREATE TABLE public.swap_requests (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    target_instructor_id TEXT NOT NULL,
    target_instructor_name TEXT NOT NULL,
    class_id TEXT NOT NULL,
    class_name TEXT NOT NULL,
    schedule_id TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- FOLDERS
CREATE TABLE public.folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    allowed_roles JSONB DEFAULT '[]'::jsonb, -- Array of strings
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- DOCUMENTS
CREATE TABLE public.documents (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    size TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TEXT NOT NULL
);

-- BASES
CREATE TABLE public.bases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    airport_class TEXT NOT NULL
);

-- FIREFIGHTERS
CREATE TABLE public.firefighters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base TEXT NOT NULL,
    region TEXT NOT NULL,
    airport_class TEXT NOT NULL,
    graduation_date TEXT NOT NULL,
    last_update_date TEXT NOT NULL,
    is_not_updated BOOLEAN DEFAULT false,
    last_fire_exercise_date TEXT,
    is_away BOOLEAN DEFAULT false,
    away_start_date TEXT,
    away_end_date TEXT,
    away_reason TEXT
);

-- FIREFIGHTER LOGS
CREATE TABLE public.firefighter_logs (
    id TEXT PRIMARY KEY,
    firefighter_id TEXT NOT NULL,
    firefighter_name TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    details TEXT NOT NULL
);

-- SETUP TEARDOWN ASSIGNMENTS
CREATE TABLE public.setup_teardown_assignments (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    class_name TEXT NOT NULL,
    type TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    instructor_name TEXT NOT NULL,
    days INTEGER NOT NULL,
    rate NUMERIC NOT NULL,
    total_value NUMERIC NOT NULL,
    date TEXT NOT NULL,
    notes TEXT
);

-- 3. ENABLE RLS (Segurança Básica)
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

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.folders FOR ALL USING (true);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.documents FOR ALL USING (true);

ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.bases FOR ALL USING (true);

ALTER TABLE public.firefighters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.firefighters FOR ALL USING (true);

ALTER TABLE public.firefighter_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.firefighter_logs FOR ALL USING (true);

ALTER TABLE public.setup_teardown_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.setup_teardown_assignments FOR ALL USING (true);


-- 4. INSERT MASTER USER (Usuário Admin)
INSERT INTO public.users (
    id, name, cpf, role, email, phone, birth_date, registration_date, created_by, 
    uniform_size, ppe_size, photo_url, password
) VALUES (
    'admin-master-id',
    'Administrador Mestre',
    '000.000.000-00',
    'Administrador',
    'admin@medgroup.com',
    '(11) 99999-9999',
    '1980-01-01',
    '2024-01-01',
    'System',
    '{"jumpsuit": "M", "shoes": "40", "shirt": "M"}',
    '{"pants": "M", "jacket": "M", "gloves": "M", "boots": "40"}',
    'https://ui-avatars.com/api/?name=Admin+Master&background=random',
    'admin123' -- Em produção, use hash!
);

-- 5. MENSAGEM FINAL
DO $$
BEGIN
    RAISE NOTICE '✅ BANCO DE DADOS RESETADO COM SUCESSO!';
    RAISE NOTICE 'Todas as tabelas foram recriadas com schema correto.';
    RAISE NOTICE 'Usuário Mestre criado: admin@medgroup.com';
END $$;
