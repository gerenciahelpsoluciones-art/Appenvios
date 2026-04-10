
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://matyjysinegbibozhoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmlib3pob3EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3MTUzNzM1NiwiZXhwIjoyMDg3MTEzMzU2fQ.sujolHHtMEsNs7EPlLYchAZRCLyMz7ek62x5eQ0h0kY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log('--- Checking visitantes_web in NEW Project ---');
  try {
    const { count, error } = await supabase
      .from('visitantes_web')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Table error:', error.message, error.code);
    } else {
      console.log(`✅ Table exists! Count: ${count}`);
    }
  } catch (e) {
    console.error('❌ Critical Error:', e);
  }
}

checkTable();
