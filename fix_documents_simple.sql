-- TENTATIVA SIMPLIFICADA
-- Vamos apenas marcar a pasta como pública, sem mexer nas regras complexas de segurança.
-- Isso geralmente é permitido e suficiente.

UPDATE storage.buckets
SET public = true
WHERE id = 'documents';
