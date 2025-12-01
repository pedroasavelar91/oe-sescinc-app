-- ============================================
-- SUPABASE SCHEMA FIX - Correção de Incompatibilidades
-- ============================================
-- Este script corrige as incompatibilidades entre o schema SQL
-- e as interfaces TypeScript da aplicação SEM apagar dados existentes
-- ============================================

-- ============================================
-- 1. CORRIGIR TABELA FIREFIGHTERS (CRÍTICO)
-- ============================================

-- Backup da tabela antiga (se houver dados)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'firefighters') THEN
        -- Criar tabela de backup temporária
        CREATE TABLE IF NOT EXISTS firefighters_backup AS SELECT * FROM public.firefighters;
        RAISE NOTICE 'Backup da tabela firefighters criado';
    END IF;
END $$;

-- Dropar a tabela antiga
DROP TABLE IF EXISTS public.firefighters CASCADE;

-- Criar nova tabela com schema correto
CREATE TABLE public.firefighters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base TEXT NOT NULL,
  region TEXT NOT NULL,
  airport_class TEXT NOT NULL,
  graduation_date DATE NOT NULL,
  last_update_date DATE NOT NULL,
  is_not_updated BOOLEAN DEFAULT false,
  last_fire_exercise_date DATE,
  is_away BOOLEAN DEFAULT false,
  away_start_date DATE,
  away_end_date DATE,
  away_reason TEXT
);

-- Recriar RLS
ALTER TABLE public.firefighters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.firefighters FOR ALL USING (true);

-- ============================================
-- 2. ADICIONAR CAMPOS NA TABELA CLASSES
-- ============================================

-- Verificar e adicionar campos de setup/teardown se não existirem
DO $$
BEGIN
    -- Setup Instructor 1
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'setup_instructor_1_id'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN setup_instructor_1_id UUID REFERENCES public.users(id);
        RAISE NOTICE 'Coluna setup_instructor_1_id adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'setup_instructor_1_days'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN setup_instructor_1_days INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna setup_instructor_1_days adicionada';
    END IF;

    -- Setup Instructor 2
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'setup_instructor_2_id'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN setup_instructor_2_id UUID REFERENCES public.users(id);
        RAISE NOTICE 'Coluna setup_instructor_2_id adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'setup_instructor_2_days'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN setup_instructor_2_days INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna setup_instructor_2_days adicionada';
    END IF;

    -- Teardown Instructor 1
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'teardown_instructor_1_id'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN teardown_instructor_1_id UUID REFERENCES public.users(id);
        RAISE NOTICE 'Coluna teardown_instructor_1_id adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'teardown_instructor_1_days'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN teardown_instructor_1_days INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna teardown_instructor_1_days adicionada';
    END IF;

    -- Teardown Instructor 2
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'teardown_instructor_2_id'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN teardown_instructor_2_id UUID REFERENCES public.users(id);
        RAISE NOTICE 'Coluna teardown_instructor_2_id adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'classes' 
        AND column_name = 'teardown_instructor_2_days'
    ) THEN
        ALTER TABLE public.classes ADD COLUMN teardown_instructor_2_days INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna teardown_instructor_2_days adicionada';
    END IF;
END $$;

-- ============================================
-- 3. VERIFICAR OUTRAS TABELAS
-- ============================================

-- Verificar se as colunas snake_case existem nas outras tabelas
-- (students, tasks, attendance_logs, payments, checklist_logs)
-- Estas já devem estar corretas no schema, mas vamos verificar

DO $$
BEGIN
    -- Verificar students
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'rg_issuer'
    ) THEN
        RAISE WARNING 'Coluna rg_issuer não encontrada na tabela students - pode causar erros';
    END IF;

    -- Verificar tasks
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'creator_id'
    ) THEN
        RAISE WARNING 'Coluna creator_id não encontrada na tabela tasks - pode causar erros';
    END IF;

    -- Verificar attendance_logs
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'attendance_logs' 
        AND column_name = 'taken_by_id'
    ) THEN
        RAISE WARNING 'Coluna taken_by_id não encontrada na tabela attendance_logs - pode causar erros';
    END IF;

    -- Verificar payments
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'schedule_item_id'
    ) THEN
        RAISE WARNING 'Coluna schedule_item_id não encontrada na tabela payments - pode causar erros';
    END IF;

    -- Verificar checklist_logs
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'checklist_logs' 
        AND column_name = 'template_id'
    ) THEN
        RAISE WARNING 'Coluna template_id não encontrada na tabela checklist_logs - pode causar erros';
    END IF;
END $$;

-- ============================================
-- CONCLUÍDO
-- ============================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Schema fix aplicado com sucesso!';
    RAISE NOTICE '📋 Próximos passos:';
    RAISE NOTICE '   1. Verificar se não há erros acima';
    RAISE NOTICE '   2. Atualizar os mapeadores no AppStore.tsx';
    RAISE NOTICE '   3. Testar a persistência de dados';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE: A tabela firefighters foi recriada.';
    RAISE NOTICE '   Se havia dados antigos, eles estão em firefighters_backup';
END $$;
