import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://matyjysinegbibdwzhoq.supabase.co';
const ANON_KEY = 'sb_publishable_Y0VR9m4LtJRlSoKRq_c3OQ_10ViUr3n';
const SERVICE_KEY = 'sb_secret_vi6890ktDX5SceFPvzNF_w_B5_ze28O';

const supabase = createClient(SUPABASE_URL, ANON_KEY);
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnose() {
  console.log('\n🔐 1. Probando login con admin@velia.com / Velia2024!...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@velia.com',
    password: 'Velia2024!'
  });

  if (error) {
    console.log('❌ Login FALLÓ:', error.message, `(code: ${error.code})`);
  } else {
    console.log('✅ Login exitoso! User ID:', data.user.id);
  }

  console.log('\n📋 2. Verificando perfil en velia_perfiles...');
  const { data: perfiles, error: perfErr } = await admin
    .from('velia_perfiles')
    .select('*');
  
  if (perfErr) {
    console.log('❌ Error consultando velia_perfiles:', perfErr.message);
  } else {
    console.log('Perfiles encontrados:', perfiles.length);
    perfiles.forEach(p => console.log(`   - ${p.email} | rol: ${p.rol} | estado: ${p.estado}`));
  }

  console.log('\n👤 3. Usuarios en auth.users con email velia...');
  const { data: { users } } = await admin.auth.admin.listUsers();
  const veliaUsers = users.filter(u => u.email?.includes('velia'));
  veliaUsers.forEach(u => {
    console.log(`   - ${u.email}`);
    console.log(`     ID: ${u.id}`);
    console.log(`     Confirmado: ${u.email_confirmed_at ? 'SÍ' : 'NO'}`);
    console.log(`     Última sesión: ${u.last_sign_in_at || 'nunca'}`);
  });
}

diagnose();
