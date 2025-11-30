// Teste rápido de conexão com Supabase
import { supabase } from './services/supabase';

async function testSupabaseConnection() {
    console.log('🔍 Testando conexão com Supabase...');

    try {
        // Testar se consegue listar buckets
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error('❌ Erro ao conectar:', error.message);
            return;
        }

        console.log('✅ Conectado ao Supabase!');
        console.log('📦 Buckets encontrados:', data.map(b => b.name));

        // Verificar se os buckets necessários existem
        const hasDocuments = data.some(b => b.name === 'documents');
        const hasPhotos = data.some(b => b.name === 'profile-photos');

        if (hasDocuments && hasPhotos) {
            console.log('✅ Todos os buckets necessários estão criados!');
        } else {
            console.log('⚠️ Faltam buckets:');
            if (!hasDocuments) console.log('  - documents');
            if (!hasPhotos) console.log('  - profile-photos');
        }
    } catch (err) {
        console.error('❌ Erro:', err);
    }
}

testSupabaseConnection();
