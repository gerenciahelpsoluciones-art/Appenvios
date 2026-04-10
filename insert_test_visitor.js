
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://matyjysinegbibdwzhoq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmlid3pob3EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODIxNjEwMiwiZXhwIjoyMDUzNzkyMTAyfQ.UvshWST_v9G14u6fW5G1YtO_p5m728yY_u_vi_6890';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('--- Inserting test visitor ---');
  const { data, error } = await supabase
    .from('visitantes_web')
    .insert([
      { 
        path: '/pruebas-antigravity', 
        device: 'Mobile', 
        location: 'Bogotá, CO' 
      }
    ]);

  if (error) {
    console.error('❌ Error inserting visitor:', error);
  } else {
    console.log('✅ Test visitor inserted successfully!');
  }
}

testInsert();
