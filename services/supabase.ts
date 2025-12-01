import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
// Usando variáveis de ambiente para segurança
const supabaseUrl: string = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseKey: string = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Criação do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
    return supabaseUrl !== '' && supabaseKey !== '';
};
