import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://matyjysinegbibdwzhoq.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_vi6890ktDX5SceFPvzNF_w_B5_ze28O';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Verificar qué tablas velia_ existen
async function checkTables() {
  console.log('\n📊 Verificando tablas velia_ existentes...\n');
  
  const tables = ['velia_perfiles', 'velia_productos', 'velia_ventas', 'velia_detalles_venta', 'velia_proveedores'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: NO EXISTE (${error.code})`);
      } else {
        console.log(`✅ ${table}: existe, ${count} registros`);
      }
    } catch (e) {
      console.log(`❌ ${table}: error - ${e.message}`);
    }
  }
}

checkTables();
