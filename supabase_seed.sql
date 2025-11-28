-- Script de População do Banco de Dados OE-SESCINC
-- Execute este script no SQL Editor do Supabase

-- Inserir usuário Administrador Master
INSERT INTO public.users (id, name, cpf, role, email, phone, birth_date, registration_date, created_by, base, uniform_size, ppe_size, password) VALUES
('admin-master', 'Administrador Master', '000.000.000-00', 'GESTOR', 'admin@medgroup.com', '11999999999', '1980-01-01', '2023-01-01'::timestamp, 'System', NULL, 
 '{"jumpsuit": "G", "shoes": "42", "shirt": "G"}'::jsonb, 
 '{"pants": "G", "jacket": "G", "gloves": "M", "boots": "42"}'::jsonb, 
 'admin123')
ON CONFLICT (id) DO NOTHING;

-- Inserir outros usuários de exemplo
INSERT INTO public.users (id, name, cpf, role, email, phone, birth_date, registration_date, created_by, base, uniform_size, ppe_size, password) VALUES
('instr-1', 'João Instrutor', '111.222.333-44', 'INSTRUTOR', 'joao@firesafe.com', '11988888888', '1985-05-15', '2023-02-01'::timestamp, 'Administrador Master', NULL,
 '{"jumpsuit": "M", "shoes": "40", "shirt": "M"}'::jsonb,
 '{"pants": "M", "jacket": "M", "gloves": "G", "boots": "40"}'::jsonb,
 '123'),
('coord-1', 'Ana Coordenadora', '999.888.777-66', 'COORDENADOR', 'ana@firesafe.com', '11977777777', '1990-03-20', '2023-01-15'::timestamp, 'Administrador Master', 'SBGR',
 '{"jumpsuit": "P", "shoes": "36", "shirt": "P"}'::jsonb,
 '{"pants": "P", "jacket": "P", "gloves": "P", "boots": "36"}'::jsonb,
 '123'),
('driver-1', 'Marcos Motorista', '777.666.555-44', 'MOTORISTA', 'marcos@firesafe.com', '11966666666', '1988-08-08', '2023-03-01'::timestamp, 'Administrador Master', NULL,
 '{"jumpsuit": "G", "shoes": "42", "shirt": "G"}'::jsonb,
 '{"pants": "G", "jacket": "G", "gloves": "G", "boots": "42"}'::jsonb,
 '123'),
('amb-1', 'Roberto Embaixador', '555.444.333-22', 'EMBAIXADOR', 'roberto@firesafe.com', '11955554444', '1982-12-12', '2023-04-01'::timestamp, 'Administrador Master', 'SBEG',
 '{"jumpsuit": "G", "shoes": "42", "shirt": "G"}'::jsonb,
 '{"pants": "G", "jacket": "G", "gloves": "G", "boots": "42"}'::jsonb,
 '123')
ON CONFLICT (id) DO NOTHING;

-- Inserir bases
INSERT INTO public.bases (id, name, region, airport_class) VALUES
('b1', 'SBGR', 'Sudeste', 'IV'),
('b2', 'SBEG', 'Norte', 'II'),
('b3', 'SBSJ', 'Sul', 'III')
ON CONFLICT (id) DO NOTHING;

-- Inserir bombeiros
INSERT INTO public.firefighters (id, name, base, region, airport_class, graduation_date, last_update_date, is_not_updated, last_fire_exercise_date, is_away) VALUES
('ff-1', 'Sérgio Bombeiro', 'SBGR', 'Sudeste', 'IV', '2022-01-10', '2024-01-10'::timestamp, false, '2024-02-15', false),
('ff-2', 'Marcos Norte', 'SBEG', 'Norte', 'II', '2021-05-20', '2023-05-20'::timestamp, false, NULL, false),
('ff-3', 'Fernando Afastado', 'SBSJ', 'Sul', 'III', '2020-01-01', '2022-01-01'::timestamp, false, NULL, true)
ON CONFLICT (id) DO NOTHING;

-- Verificar inserções
SELECT 'Usuários inseridos:' as status, COUNT(*) as total FROM public.users
UNION ALL
SELECT 'Bases inseridas:', COUNT(*) FROM public.bases
UNION ALL
SELECT 'Bombeiros inseridos:', COUNT(*) FROM public.firefighters;
