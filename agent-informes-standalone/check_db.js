import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('--- Supabase Diagnostic ---');
    
    const tables = ['clientes', 'app_users', 'productos', 'cotizaciones'];
    
    for (const table of tables) {
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
            
        if (error) {
            console.error(`Error checking ${table}:`, error.message);
        } else {
            console.log(`Table ${table}: FOUND (${count} records)`);
        }
    }
    
    console.log('--- Migration Check ---');
    const { error: migrationError } = await supabase
        .from('contratos_obligaciones')
        .select('*', { count: 'exact', head: true });
        
    if (migrationError) {
        console.log('Table contratos_obligaciones: NOT FOUND (Needs migration)');
    } else {
        console.log('Table contratos_obligaciones: FOUND (Migration already done)');
    }
}

checkTables();
