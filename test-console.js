// Test Supabase connection and data saving
// Paste this in the browser console (F12)

// 1. Check if Supabase is configured
console.log('=== SUPABASE TEST ===');
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

// 2. Test direct insert
import { supabase } from './services/supabase';

const testUser = {
    id: 'test-' + Date.now(),
    name: 'Teste Console',
    cpf: '999.999.999-99',
    role: 'Instrutor',
    email: 'console@test.com',
    phone: '11888888888',
    birthDate: '1990-01-01',
    registrationDate: new Date().toISOString().split('T')[0],
    createdBy: 'Console Test',
    uniformSize: { jumpsuit: 'M', shoes: '40', shirt: 'M' },
    ppeSize: { pants: 'M', jacket: 'M', gloves: 'M', boots: '40' },
    password: 'test123'
};

console.log('Testing INSERT...');
supabase.from('users').insert(testUser).then(({ data, error }) => {
    if (error) {
        console.error('❌ INSERT ERROR:', error);
    } else {
        console.log('✅ INSERT SUCCESS:', data);
    }
});

// 3. Test SELECT
console.log('Testing SELECT...');
supabase.from('users').select('*').then(({ data, error }) => {
    if (error) {
        console.error('❌ SELECT ERROR:', error);
    } else {
        console.log('✅ SELECT SUCCESS - Total users:', data?.length);
        console.log('Users:', data);
    }
});
