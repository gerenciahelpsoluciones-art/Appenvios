
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://matyjysinegbibdwzhoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmlid3pob3EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODIxNjEwMiwiZXhwIjoyMDUzNzkyMTAyfQ.UvshWST_v9G14u6fW5G1YtO_p5m728yY_u_vi_6890';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVisitors() {
  console.log('--- Checking visitantes_web table ---');
  const { data, error, count } = await supabase
    .from('visitantes_web')
    .select('*', { count: 'exact' })
    .order('fecha', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching from visitantes_web:', error);
  } else {
    console.log(`✅ Total visitors in DB: ${count}`);
    console.log('Last 5 visitors:', data);
  }
}

checkVisitors();
