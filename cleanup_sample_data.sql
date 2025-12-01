-- Script SQL para limpar dados de exemplo do Supabase
-- Execute este script no SQL Editor do Supabase

-- ATENÇÃO: Este script vai DELETAR TODOS OS DADOS das tabelas!
-- Certifique-se de fazer backup se necessário antes de executar.

-- Limpar dados de exemplo (manter apenas dados reais)
-- Se você quiser manter algum dado específico, modifique as queries abaixo

-- 1. Limpar tarefas de exemplo
DELETE FROM tasks WHERE creator_id IN (
  SELECT id FROM users WHERE email LIKE '%@example.com'
);

-- 2. Limpar turmas de exemplo  
DELETE FROM classes WHERE name LIKE '%Exemplo%' OR name LIKE '%Test%';

-- 3. Limpar alunos de exemplo
DELETE FROM students WHERE email LIKE '%@example.com' OR name LIKE '%Exemplo%';

-- 4. Limpar usuários de exemplo (CUIDADO: não delete o admin!)
DELETE FROM users WHERE email LIKE '%@example.com' AND email != 'admin@medgroup.com';

-- 5. Limpar cursos de exemplo
DELETE FROM courses WHERE name LIKE '%Exemplo%' OR name LIKE '%Test%';

-- 6. Limpar logs de presença
DELETE FROM attendance_logs WHERE class_id NOT IN (SELECT id FROM classes);

-- 7. Limpar logs de notas
DELETE FROM grade_logs WHERE class_id NOT IN (SELECT id FROM classes);

-- 8. Limpar pagamentos órfãos
DELETE FROM payments WHERE schedule_item_id NOT IN (
  SELECT unnest(schedule::json->'id') FROM classes
);

-- 9. Limpar notificações antigas
DELETE FROM notifications WHERE timestamp < NOW() - INTERVAL '30 days';

-- 10. Limpar solicitações de troca antigas
DELETE FROM swap_requests WHERE status != 'Pendente' AND timestamp < NOW() - INTERVAL '7 days';

-- ALTERNATIVA: Se quiser limpar TUDO e começar do zero (CUIDADO!)
-- Descomente as linhas abaixo apenas se tiver certeza:

-- TRUNCATE TABLE tasks CASCADE;
-- TRUNCATE TABLE classes CASCADE;
-- TRUNCATE TABLE students CASCADE;
-- TRUNCATE TABLE courses CASCADE;
-- TRUNCATE TABLE attendance_logs CASCADE;
-- TRUNCATE TABLE grade_logs CASCADE;
-- TRUNCATE TABLE payments CASCADE;
-- TRUNCATE TABLE checklist_logs CASCADE;
-- TRUNCATE TABLE notifications CASCADE;
-- TRUNCATE TABLE swap_requests CASCADE;
-- TRUNCATE TABLE firefighters CASCADE;
-- TRUNCATE TABLE firefighter_logs CASCADE;
-- TRUNCATE TABLE setup_teardown_assignments CASCADE;

-- Manter apenas o usuário admin
-- DELETE FROM users WHERE email != 'admin@medgroup.com';

-- Verificar o que restou
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'courses', COUNT(*) FROM courses;
