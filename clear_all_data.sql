-- Script SIMPLES para limpar TODOS os dados
-- Execute este script no SQL Editor do Supabase

-- ATENÇÃO: Isto vai DELETAR TUDO!
-- Apenas o usuário admin será mantido

-- 1. Limpar todas as tabelas (ordem importa por causa de foreign keys)
DELETE FROM swap_requests;
DELETE FROM notifications;
DELETE FROM checklist_logs;
DELETE FROM firefighter_logs;
DELETE FROM firefighters;
DELETE FROM setup_teardown_assignments;
DELETE FROM payments;
DELETE FROM grade_logs;
DELETE FROM attendance_logs;
DELETE FROM tasks;
DELETE FROM students;
DELETE FROM classes;
DELETE FROM courses;
DELETE FROM bases;
DELETE FROM checklist_templates;
DELETE FROM folders;
DELETE FROM documents;

-- 2. Limpar usuários (MANTER APENAS O ADMIN)
DELETE FROM users WHERE email != 'admin@medgroup.com';

-- 3. Verificar o que restou
SELECT 'users' as table_name, COUNT(*) as remaining_count FROM users
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
