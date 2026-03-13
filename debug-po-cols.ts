import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkCols() {
    const { data, error } = await supabase.from('ordenes_compra').select('*').limit(1);
    if (error) {
        console.error('Error:', error.message);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('No data in ordenes_compra to check columns.');
        // Try getting column names via RPC if available or just assume they don't exist
        const { data: cols, error: errC } = await supabase.rpc('get_table_columns', { table_name: 'ordenes_compra' });
        if (errC) console.error('RPC Error:', errC.message);
        else console.log('RPC columns:', cols);
    }
}

checkCols();
