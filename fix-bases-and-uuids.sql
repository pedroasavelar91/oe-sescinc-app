-- ============================================
-- FIX BASES AND UUIDS
-- ============================================

-- 1. ADICIONAR COLUNA AIRPORT_CLASS NA TABELA BASES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bases' 
        AND column_name = 'airport_class'
    ) THEN
        ALTER TABLE public.bases ADD COLUMN airport_class TEXT;
        RAISE NOTICE 'Coluna airport_class adicionada na tabela bases';
    END IF;
END $$;

-- 2. ALTERAR COLUNAS ID PARA TEXT (Para aceitar IDs do frontend)
-- O frontend gera IDs curtos (ex: "0d799ggk4") que não são UUIDs válidos.
-- Precisamos alterar o tipo das colunas ID para TEXT.

-- Tabela COURSES
ALTER TABLE public.courses ALTER COLUMN id TYPE TEXT;

-- Tabela CLASSES
ALTER TABLE public.classes ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.classes ALTER COLUMN course_id TYPE TEXT;

-- Tabela STUDENTS
ALTER TABLE public.students ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.students ALTER COLUMN class_id TYPE TEXT;

-- Tabela TASKS
ALTER TABLE public.tasks ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.tasks ALTER COLUMN creator_id TYPE TEXT;
ALTER TABLE public.tasks ALTER COLUMN assignee_id TYPE TEXT;

-- Tabela ATTENDANCE_LOGS
ALTER TABLE public.attendance_logs ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.attendance_logs ALTER COLUMN class_id TYPE TEXT;

-- Tabela GRADE_LOGS
ALTER TABLE public.grade_logs ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.grade_logs ALTER COLUMN class_id TYPE TEXT;

-- Tabela PAYMENTS
ALTER TABLE public.payments ALTER COLUMN id TYPE TEXT;

-- Tabela CHECKLIST_TEMPLATES
ALTER TABLE public.checklist_templates ALTER COLUMN id TYPE TEXT;

-- Tabela CHECKLIST_LOGS
ALTER TABLE public.checklist_logs ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.checklist_logs ALTER COLUMN template_id TYPE TEXT;
ALTER TABLE public.checklist_logs ALTER COLUMN class_id TYPE TEXT;

-- Tabela FIREFIGHTERS
ALTER TABLE public.firefighters ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.firefighters ALTER COLUMN base TYPE TEXT; -- base armazena o ID da base (que pode ser curto)

-- Tabela FIREFIGHTER_LOGS
ALTER TABLE public.firefighter_logs ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.firefighter_logs ALTER COLUMN firefighter_id TYPE TEXT;

-- Tabela BASES
ALTER TABLE public.bases ALTER COLUMN id TYPE TEXT;

-- Tabela FOLDERS
ALTER TABLE public.folders ALTER COLUMN id TYPE TEXT;

-- Tabela DOCUMENTS
ALTER TABLE public.documents ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.documents ALTER COLUMN folder_id TYPE TEXT;

-- Tabela NOTIFICATIONS
ALTER TABLE public.notifications ALTER COLUMN id TYPE TEXT;

-- Tabela SWAP_REQUESTS
ALTER TABLE public.swap_requests ALTER COLUMN id TYPE TEXT;

-- Tabela SETUP_TEARDOWN_ASSIGNMENTS
ALTER TABLE public.setup_teardown_assignments ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.setup_teardown_assignments ALTER COLUMN class_id TYPE TEXT;


RAISE NOTICE '✅ Correções aplicadas com sucesso!';
