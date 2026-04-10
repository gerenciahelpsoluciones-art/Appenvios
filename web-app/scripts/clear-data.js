import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Manually parse .env file
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.join('=').trim();
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: No se encontraron las credenciales de Supabase en el archivo .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES_TO_CLEAR = ['cotizaciones', 'despachos', 'ordenes_compra', 'reparaciones'];
// const OPTIONAL_TABLES = ['ordenes_compra', 'reparaciones']; 

async function clearData(dryRun = true) {
    console.log(`\n🚀 Iniciando limpieza de base de datos (${dryRun ? 'MODO SIMULACIÓN' : 'MODO REAL'})\n`);

    for (const table of TABLES_TO_CLEAR) {
        try {
            // Count records first
            const { count, error: countError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (countError) throw countError;

            console.log(`📊 Tabla [${table}]: ${count} registros encontrados.`);

            if (!dryRun && count > 0) {
                const { error: deleteError } = await supabase
                    .from(table)
                    .delete()
                    .not('id', 'is', null); // Universal filter for all records

                if (deleteError) throw deleteError;
                console.log(`✅ Tabla [${table}]: Registros eliminados correctamente.`);
            }
        } catch (error) {
            console.error(`❌ Error en tabla [${table}]:`, error.message);
            if (error.code === '42501') {
                console.error('   💡 Sugerencia: Esto parece ser un problema de permisos (RLS). Asegúrate de que las políticas de Supabase permitan eliminar registros con la Anon Key o usa una Service Role Key.');
            }
        }
    }

    if (dryRun) {
        console.log('\n⚠️  Esto fue una simulación. Para realizar la eliminación real, ejecuta:');
        console.log('   node scripts/clear-data.js --confirm\n');
    } else {
        console.log('\n✨ Limpieza completada con éxito.\n');
    }
}

const isConfirm = process.argv.includes('--confirm');
clearData(!isConfirm);
