import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Using credentials from web-app/.env
dotenv.config({ path: path.join(process.cwd(), 'web-app', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log('Listing some tables to check existence...');
  const tables = ['productos', 'inventory', 'items', 'catalogo', 'piezas', 'velia_productos'];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not find')) {
        // Table not found or similar
      } else {
        console.log(`Table "${table}": Error ${error.code} - ${error.message}`);
      }
    } else {
      console.log(`Table "${table}": FOUND with ${count} records.`);
      // If found, let's see columns
      const { data: sample } = await supabase.from(table).select('*').limit(1);
      if (sample && sample[0]) {
        console.log(`  Columns in "${table}":`, Object.keys(sample[0]));
      }
    }
  }
}

listTables();
