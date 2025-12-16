-- EXECUTE ESTE SCRIPT NO "SQL EDITOR" DO SEU SUPABASE
-- Ele corrige as permissões da pasta de documentos para permitir o acesso aos arquivos.

-- 1. Torna o bucket 'documents' público (permite download dos arquivos via link)
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- 2. Cria políticas de segurança para garantir o acesso
-- Habilita RLS (Row Level Security) se não estiver ativo
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas conflitantes (opcional, para evitar duplicidade de erro)
DROP POLICY IF EXISTS "Permitir Leitura Pública Documents" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Upload Autenticado Documents" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Delete Autenticado Documents" ON storage.objects;

-- Cria política para permitir que qualquer pessoa visualize (baixe) os arquivos da pasta 'documents'
CREATE POLICY "Permitir Leitura Pública Documents"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

-- Cria política para permitir que usuários logados façam upload
CREATE POLICY "Permitir Upload Autenticado Documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'documents' );

-- Cria política para permitir que usuários logados apaguem arquivos (se necessário)
CREATE POLICY "Permitir Delete Autenticado Documents"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'documents' );

-- Cria política para permitir atualização (update)
CREATE POLICY "Permitir Update Autenticado Documents"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'documents' );
