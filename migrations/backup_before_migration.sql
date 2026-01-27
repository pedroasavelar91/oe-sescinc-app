-- =============================================================
-- BACKUP COMPLETO ANTES DA MIGRAÇÃO DE IDs
-- Execute este script no SQL Editor do Supabase ANTES da migração
-- =============================================================

-- Backup da tabela users
DROP TABLE IF EXISTS backup_users;
CREATE TABLE backup_users AS SELECT * FROM users;

-- Backup da tabela question_approvers
DROP TABLE IF EXISTS backup_question_approvers;
CREATE TABLE IF NOT EXISTS backup_question_approvers AS 
SELECT * FROM question_approvers WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_approvers');

-- Backup da tabela questions
DROP TABLE IF EXISTS backup_questions;
CREATE TABLE IF NOT EXISTS backup_questions AS 
SELECT * FROM questions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions');

-- Backup da tabela question_reviews
DROP TABLE IF EXISTS backup_question_reviews;
CREATE TABLE IF NOT EXISTS backup_question_reviews AS 
SELECT * FROM question_reviews WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_reviews');

-- Backup da tabela tasks
DROP TABLE IF EXISTS backup_tasks;
CREATE TABLE IF NOT EXISTS backup_tasks AS 
SELECT * FROM tasks WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks');

-- Backup da tabela notifications
DROP TABLE IF EXISTS backup_notifications;
CREATE TABLE IF NOT EXISTS backup_notifications AS 
SELECT * FROM notifications WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications');

-- Backup da tabela payments
DROP TABLE IF EXISTS backup_payments;
CREATE TABLE IF NOT EXISTS backup_payments AS 
SELECT * FROM payments WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments');

-- Backup da tabela class_photos
DROP TABLE IF EXISTS backup_class_photos;
CREATE TABLE IF NOT EXISTS backup_class_photos AS 
SELECT * FROM class_photos WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_photos');

-- Backup da tabela firefighter_logs
DROP TABLE IF EXISTS backup_firefighter_logs;
CREATE TABLE IF NOT EXISTS backup_firefighter_logs AS 
SELECT * FROM firefighter_logs WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firefighter_logs');

-- Backup da tabela attendance_logs
DROP TABLE IF EXISTS backup_attendance_logs;
CREATE TABLE IF NOT EXISTS backup_attendance_logs AS 
SELECT * FROM attendance_logs WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_logs');

-- Backup da tabela grade_logs
DROP TABLE IF EXISTS backup_grade_logs;
CREATE TABLE IF NOT EXISTS backup_grade_logs AS 
SELECT * FROM grade_logs WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grade_logs');

-- Backup da tabela checklist_logs
DROP TABLE IF EXISTS backup_checklist_logs;
CREATE TABLE IF NOT EXISTS backup_checklist_logs AS 
SELECT * FROM checklist_logs WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklist_logs');

-- Backup da tabela folders
DROP TABLE IF EXISTS backup_folders;
CREATE TABLE IF NOT EXISTS backup_folders AS 
SELECT * FROM folders WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'folders');

-- Backup da tabela documents
DROP TABLE IF EXISTS backup_documents;
CREATE TABLE IF NOT EXISTS backup_documents AS 
SELECT * FROM documents WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents');

-- Backup da tabela swap_requests
DROP TABLE IF EXISTS backup_swap_requests;
CREATE TABLE IF NOT EXISTS backup_swap_requests AS 
SELECT * FROM swap_requests WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'swap_requests');

-- Backup da tabela setup_teardown_assignments
DROP TABLE IF EXISTS backup_setup_teardown_assignments;
CREATE TABLE IF NOT EXISTS backup_setup_teardown_assignments AS 
SELECT * FROM setup_teardown_assignments WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'setup_teardown_assignments');

-- Verificar tabelas de backup criadas
SELECT 
    'backup_users' as tabela, COUNT(*) as registros FROM backup_users
UNION ALL
SELECT 'backup_question_approvers', COUNT(*) FROM backup_question_approvers
UNION ALL
SELECT 'backup_questions', COUNT(*) FROM backup_questions
UNION ALL
SELECT 'backup_tasks', COUNT(*) FROM backup_tasks
UNION ALL
SELECT 'backup_notifications', COUNT(*) FROM backup_notifications
UNION ALL
SELECT 'backup_payments', COUNT(*) FROM backup_payments;

-- =============================================================
-- BACKUP COMPLETO REALIZADO!
-- Agora você pode executar o script de migração com segurança.
-- =============================================================
