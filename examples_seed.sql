-- ============================================================================
-- SEED DATA FOR DASHBOARD EXAMPLES
-- Run this in your Supabase SQL Editor to populate the dashboard with rich data.
-- ============================================================================

-- 1. FIREFIGHTERS (Bombeiros)
-- Varied bases, expiration dates (some expired, some valid, some soon)
INSERT INTO firefighters (id, name, base, region, airport_class, graduation_date, last_update_date, last_fire_exercise_date, is_away) VALUES
-- Base SBGR (Guarulhos)
('ff-001', 'Sgt. Silva', 'SBGR', 'Sudeste', 'IV', '2010-05-15', '2023-11-20', '2023-10-10', false), -- Update due soon
('ff-002', 'Cb. Oliveira', 'SBGR', 'Sudeste', 'IV', '2012-08-20', '2024-01-15', '2024-02-01', false), -- Valid
('ff-003', 'Sd. Souza', 'SBGR', 'Sudeste', 'IV', '2015-03-10', '2023-05-01', '2023-06-15', false), -- Expired/Late
('ff-004', 'Sgt. Pereira', 'SBGR', 'Sudeste', 'IV', '2011-11-11', '2023-12-01', '2023-11-01', false),

-- Base SBRJ (Santos Dumont)
('ff-005', 'Sub. Costa', 'SBRJ', 'Sudeste', 'III', '2008-02-28', '2024-03-10', '2024-03-10', false),
('ff-006', 'Cb. Lima', 'SBRJ', 'Sudeste', 'III', '2014-07-22', '2023-08-15', '2023-09-20', false),
('ff-007', 'Sd. Gomes', 'SBRJ', 'Sudeste', 'III', '2016-09-05', '2023-10-05', '2023-10-05', false),

-- Base SBSP (Congonhas)
('ff-008', 'Sgt. Alves', 'SBSP', 'Sudeste', 'IV', '2013-04-12', '2024-02-20', '2024-01-10', false),
('ff-009', 'Cb. Rocha', 'SBSP', 'Sudeste', 'IV', '2015-06-18', '2023-07-01', '2023-07-01', false),

-- Base SBBR (Brasília)
('ff-010', 'Sub. Martins', 'SBBR', 'Centro-Oeste', 'IV', '2009-12-01', '2024-01-01', '2024-01-01', false),
('ff-011', 'Sd. Ferreira', 'SBBR', 'Centro-Oeste', 'IV', '2017-01-20', '2023-09-10', '2023-08-15', false);


-- 2. COURSES & CLASSES (Turmas)
-- 2024 and 2025 Classes
INSERT INTO classes (id, name, course_id, start_date, end_date, days_of_week, hours_per_day) VALUES
('cls-2024-01', 'CBA-2 Alpha 2024', 'course-cba-2', '2024-02-01', '2024-03-15', '{1,2,3,4,5}', 8),
('cls-2024-02', 'CBA-CE Bravo 2024', 'course-cba-ce', '2024-04-01', '2024-04-30', '{1,3,5}', 4),
('cls-2025-01', 'CBA-2 Charlie 2025', 'course-cba-2', '2025-01-15', '2025-02-28', '{1,2,3,4,5}', 8);


-- 3. STUDENTS & GRADES
-- Populating students for the classes above with varied grades and statuses

-- Class Alpha (2024) - Mixed results
INSERT INTO students (id, name, cpf, class_id, enrollment_status, final_grade, final_theory, final_practical, grades) VALUES
('std-001', 'Aluno Um', '11111111111', 'cls-2024-01', 'Aprovado', 8.5, 8.0, 9.0, '{"Teoria do Fogo": 8, "APH": 9, "Salvamento": 8.5}'),
('std-002', 'Aluno Dois', '22222222222', 'cls-2024-01', 'Aprovado', 7.0, 7.0, 7.0, '{"Teoria do Fogo": 7, "APH": 7, "Salvamento": 7}'),
('std-003', 'Aluno Três', '33333333333', 'cls-2024-01', 'Reprovado', 4.5, 5.0, 4.0, '{"Teoria do Fogo": 5, "APH": 4, "Salvamento": 4.5}'),
('std-004', 'Aluno Quatro', '44444444444', 'cls-2024-01', 'Desligado', 0, 0, 0, '{}'),
('std-005', 'Aluno Cinco', '55555555555', 'cls-2024-01', 'Aprovado', 9.5, 9.0, 10.0, '{"Teoria do Fogo": 9, "APH": 10, "Salvamento": 9.5}');

-- Class Bravo (2024) - High performance
INSERT INTO students (id, name, cpf, class_id, enrollment_status, final_grade, final_theory, final_practical, grades) VALUES
('std-006', 'Aluno Seis', '66666666666', 'cls-2024-02', 'Aprovado', 9.0, 9.0, 9.0, '{"Liderança": 9, "Legislação": 9}'),
('std-007', 'Aluno Sete', '77777777777', 'cls-2024-02', 'Aprovado', 9.8, 10.0, 9.6, '{"Liderança": 10, "Legislação": 9.6}');

-- Class Charlie (2025) - Ongoing/New
INSERT INTO students (id, name, cpf, class_id, enrollment_status, final_grade, final_theory, final_practical, grades) VALUES
('std-008', 'Aluno Oito', '88888888888', 'cls-2025-01', 'Matriculado', 0, 0, 0, '{}'),
('std-009', 'Aluno Nove', '99999999999', 'cls-2025-01', 'Matriculado', 0, 0, 0, '{}');


-- 4. INSTRUCTORS & SCHEDULE (Performance)
-- Assigning instructors to schedule items to generate hours

-- Insert Schedule Items for Alpha
INSERT INTO class_schedule (id, class_id, date, duration, instructor_ids) VALUES
('sch-001', 'cls-2024-01', '2024-02-01', 4, '{inst-001}'), -- Instrutor A
('sch-002', 'cls-2024-01', '2024-02-02', 4, '{inst-001, inst-002}'), -- Instrutor A & B
('sch-003', 'cls-2024-01', '2024-02-03', 8, '{inst-002}'), -- Instrutor B
('sch-004', 'cls-2024-01', '2024-02-04', 8, '{inst-003}'), -- Instrutor C

-- Insert Schedule Items for Bravo
('sch-005', 'cls-2024-02', '2024-04-01', 4, '{inst-001}'), -- Instrutor A
('sch-006', 'cls-2024-02', '2024-04-03', 4, '{inst-001}'); -- Instrutor A

-- Insert Schedule Items for Charlie (2025)
('sch-007', 'cls-2025-01', '2025-01-15', 8, '{inst-002, inst-003}'); -- Instrutor B & C
