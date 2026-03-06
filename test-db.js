import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

// In order to not hardcode, let's import the actual client
import { supabase } from './src/lib/supabaseClient.ts';

async function test() {
    const { data: users, error: errU } = await supabase.from('usuarios').select('id, nombre, usuario').eq('nombre', 'Cistian Castro');
    console.log('Usuarios:', users, errU);

    // Let's try to insert an Alquiler with no usuario_id or with the user's ID to see the exact error
    if (users && users.length > 0) {
        const { data: alq1, error: err1 } = await supabase.from('alquileres').insert([{
            descripcion: 'TEST_SCRIPT',
            estado: 'Bodega',
            valor_mensual: 0,
            usuario_id: users[0].id
        }]);
        console.log('Insert with usuario_id error:', err1?.message);

        const { data: alq2, error: err2 } = await supabase.from('alquileres').insert([{
            descripcion: 'TEST_SCRIPT_NULL',
            estado: 'Bodega',
            valor_mensual: 0,
            usuario_id: null
        }]);
        console.log('Insert with NULL usuario_id error:', err2?.message);
    }
}

test();
