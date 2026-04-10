import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from web-app
dotenv.config({ path: path.join(process.cwd(), 'web-app', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking schema for table "productos"...');
  
  // Try to insert a dummy record with only name to see if it works
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching productos:', error);
  } else {
    console.log('Sample product record:', data?.[0] || 'No records found');
    if (data?.[0]) {
      console.log('Columns in "productos":', Object.keys(data[0]));
    }
  }

  // Also check if we can get the actual column info via SQL (if we had RPC or something, but we don't)
  // Instead, let's try to find where 'descripcion' might be missing.
}

checkSchema();
