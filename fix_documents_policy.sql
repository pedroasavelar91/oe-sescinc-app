-- PASSO FINAL PARA CORRIGIR ACESSO
-- O Supabase exige uma "regra" explícita dizendo que pode ler os arquivos.

-- Tenta criar a regra de leitura pública.
-- Se der erro dizendo que "já existe", tudo bem.
CREATE POLICY "Permitir Leitura e Download"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

-- Tenta criar regra para permitir upload (caso não tenha)
CREATE POLICY "Permitir Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'documents' );
