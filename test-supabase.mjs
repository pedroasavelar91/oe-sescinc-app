import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('🔍 Testando conexão com Supabase...\n');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Não configurada');
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Não configurada');
console.log('');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não configuradas!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Testar listagem de usuários
        console.log('📋 Testando listagem de usuários...');
        const { data, error, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Erro ao conectar:', error.message);
            console.error('Detalhes:', error);
            return;
        }

        console.log('✅ Conectado ao Supabase!');
        console.log(`📊 Total de usuários: ${count || 0}`);

        // Testar inserção
        console.log('\n🔧 Testando inserção de dados...');
        const testUser = {
            id: 'test-' + Date.now(),
            name: 'Teste Conexão',
            cpf: '000.000.000-00',
            role: 'Instrutor',
            email: 'teste@test.com',
            phone: '11999999999',
            birth_date: '1990-01-01',
            registration_date: new Date().toISOString().split('T')[0],
            created_by: 'System Test',
            uniform_size: { jumpsuit: 'M', shoes: '40', shirt: 'M' },
            ppe_size: { pants: 'M', jacket: 'M', gloves: 'M', boots: '40' },
            password: 'test123'
        };

        const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert(testUser)
            .select();

        if (insertError) {
            console.error('❌ Erro ao inserir:', insertError.message);
            console.error('Detalhes:', insertError);
        } else {
            console.log('✅ Inserção bem-sucedida!');
            console.log('Dados inseridos:', insertData);

            // Deletar o teste
            await supabase.from('users').delete().eq('id', testUser.id);
            console.log('🗑️ Dados de teste removidos');
        }

    } catch (err) {
        console.error('❌ Erro:', err);
    }
}

testConnection();
