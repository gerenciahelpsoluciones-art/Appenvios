import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkIds() {
    const { data: users, error: errU } = await supabase.from('usuarios').select('id, nombre');
    console.log('--- Usuarios ---');
    console.log(users?.slice(0, 3));

    const { data: alqs, error: errA } = await supabase.from('alquileres').select('id, usuario_id, descripcion').limit(3);
    console.log('--- Alquileres ---');
    console.log(alqs);

    const { data: cols, error: errC } = await supabase.rpc('get_foreign_keys');
    console.log('--- Foreign Keys (if RPC exists) ---', errC?.message);
}

checkIds();
