
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://matyjysinegbibdwzhoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmlid3pob3EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODIxNjEwMiwiZXhwIjoyMDUzNzkyMTAyfQ.UvshWST_v9G14u6fW5G1YtO_p5m728yY_u_vi_6890';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('--- Checking clientes_web table ---');
  const { data, error } = await supabase
    .from('clientes_web')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error fetching from clientes_web:', error);
  } else {
    console.log('✅ Successfully fetched 1 row:');
    if (data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
    } else {
      console.log('No rows found in table.');
      // Try to get column information differently if possible, or just insert a test row
      const testPayload = {
        nombre: 'TEST_AGENT',
        email: 'test@agent.com',
        telefono: '123456789',
        requerimiento: 'Test insertion from script'
      };
      console.log('Attempting test insertion (base columns)...');
      const { error: insError } = await supabase.from('clientes_web').insert([testPayload]);
      if (insError) console.error('❌ Test insertion FAILED:', insError);
      else console.log('✅ Test insertion SUCCESSFUL (base columns)');
      
      console.log('Attempting test insertion (with asesor)...');
      const { error: insError2 } = await supabase.from('clientes_web').insert([{...testPayload, asesor: 'Test Advisor'}]);
      if (insError2) console.error('❌ Test insertion with ASESOR FAILED:', insError2);
      else console.log('✅ Test insertion with ASESOR SUCCESSFUL');
    }
  }
}

checkSchema();
