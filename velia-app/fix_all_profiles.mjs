import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://matyjysinegbibdwzhoq.supabase.co';
const SERVICE_KEY = 'sb_secret_vi6890ktDX5SceFPvzNF_w_B5_ze28O';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixAllProfiles() {
  console.log('\n🔧 Sincronizando todos los usuarios velia con velia_perfiles...\n');

  const { data: { users } } = await admin.auth.admin.listUsers();
  const veliaUsers = users.filter(u => u.email?.includes('velia'));

  for (const user of veliaUsers) {
    const isAdmin = user.email === 'admin@velia.com';
    
    const { error } = await admin.from('velia_perfiles').upsert({
      id: user.id,
      nombre: user.user_metadata?.full_name || user.email.split('@')[0],
      email: user.email,
      rol: isAdmin ? 'admin' : 'vendedor',
      estado: 'activo'
    }, { onConflict: 'id' });

    if (error) {
      console.log(`❌ ${user.email}: ${error.message}`);
    } else {
      console.log(`✅ ${user.email} → rol: ${isAdmin ? 'admin' : 'vendedor'}`);
    }
  }

  console.log('\n📋 Estado final de velia_perfiles:');
  const { data } = await admin.from('velia_perfiles').select('*').order('created_at');
  data?.forEach(p => console.log(`   ${p.email} | ${p.rol} | ${p.estado}`));

  console.log('\n✅ Todos los usuarios pueden ingresar ahora.');
  console.log('\n🔑 CREDENCIALES ADMIN:');
  console.log('   Email:    admin@velia.com');
  console.log('   Password: Velia2024!');
}

fixAllProfiles();
