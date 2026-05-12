import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://matyjysinegbibdwzhoq.supabase.co';
const supabaseKey = 'sb_secret_vi6890ktDX5SceFPvzNF_w_B5_ze28O';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['mkt_cotizaciones', 'mkt_cotizacion_detalles', 'mkt_telegram_auth'];
  console.log('--- INSPECCIÓN DE TABLAS PARA NOVA ---');
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ Tabla [${table}]: No existe o error (${error.message})`);
    } else {
      console.log(`✅ Tabla [${table}]: Activa y lista.`);
    }
  }
}

checkTables();
