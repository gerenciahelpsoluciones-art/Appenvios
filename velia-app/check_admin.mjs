import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://matyjysinegbibdwzhoq.supabase.co';
const SERVICE_ROLE_KEY = 'sb_secret_vi6890ktDX5SceFPvzNF_w_B5_ze28O';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkAndFixAdmin() {
  console.log('\n🔎 Verificando usuario admin@velia.com en Auth...\n');

  // 1. Listar usuarios en auth
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) { console.error('Error listando users:', listErr); return; }

  const admin = users.find(u => u.email === 'admin@velia.com');

  if (!admin) {
    console.log('❌ admin@velia.com NO existe en auth.users — creándolo...');

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@velia.com',
      password: 'Velia2024!',
      email_confirm: true,
      user_metadata: { full_name: 'Admin VELIA', app: 'velia' }
    });

    if (error) {
      console.error('Error creando usuario:', error.message);
    } else {
      console.log('✅ Usuario creado! ID:', data.user.id);

      // Insertar en velia_perfiles
      const { error: perfError } = await supabase.from('velia_perfiles').upsert({
        id: data.user.id,
        nombre: 'Admin VELIA',
        email: 'admin@velia.com',
        rol: 'admin',
        estado: 'activo'
      });
      if (perfError) console.log('⚠️  Perfil:', perfError.message);
      else console.log('✅ Perfil en velia_perfiles creado!');

      console.log('\n🔑 CREDENCIALES:');
      console.log('   Email:    admin@velia.com');
      console.log('   Password: Velia2024!');
    }
  } else {
    console.log('✅ Usuario encontrado!');
    console.log('   ID:', admin.id);
    console.log('   Email confirmado:', admin.email_confirmed_at ? 'SÍ' : 'NO');
    console.log('   Creado:', new Date(admin.created_at).toLocaleString());

    // Actualizar contraseña
    const { error: pwErr } = await supabase.auth.admin.updateUserById(admin.id, {
      password: 'Velia2024!',
      email_confirm: true
    });

    if (pwErr) {
      console.error('\n❌ Error actualizando contraseña:', pwErr.message);
    } else {
      console.log('\n✅ Contraseña actualizada exitosamente!');
      console.log('\n🔑 CREDENCIALES ACTUALES:');
      console.log('   Email:    admin@velia.com');
      console.log('   Password: Velia2024!');
    }
  }
}

checkAndFixAdmin();
