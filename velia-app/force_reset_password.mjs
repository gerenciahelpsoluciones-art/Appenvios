import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://matyjysinegbibdwzhoq.supabase.co';
const SERVICE_KEY = 'sb_secret_vi6890ktDX5SceFPvzNF_w_B5_ze28O';
const ANON_KEY = 'sb_publishable_Y0VR9m4LtJRlSoKRq_c3OQ_10ViUr3n';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const NEW_PASSWORD = 'Velia2024';

async function forceResetPassword() {
  const USER_ID = 'ef955d9c-c7f2-4596-99db-c077d34c01c1'; // admin@velia.com

  console.log('🔑 Forzando reset de contraseña via Admin API...');

  // Usar fetch directo al admin API de Supabase
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        password: NEW_PASSWORD,
        email_confirm: true
      })
    }
  );

  const result = await response.json();
  console.log('Status:', response.status);
  
  if (response.ok) {
    console.log('✅ Contraseña actualizada!');
    console.log('   User:', result.email);
    
    // Verificar que funciona el login
    console.log('\n🔐 Probando login inmediatamente...');
    const testClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data, error } = await testClient.auth.signInWithPassword({
      email: 'admin@velia.com',
      password: NEW_PASSWORD
    });
    
    if (error) {
      console.log('❌ Login sigue fallando:', error.message);
    } else {
      console.log('✅ LOGIN EXITOSO!');
      console.log('\n🔑 CREDENCIALES CONFIRMADAS:');
      console.log('   Email:    admin@velia.com');
      console.log(`   Password: ${NEW_PASSWORD}`);
    }
  } else {
    console.log('❌ Error:', JSON.stringify(result, null, 2));
  }
}

forceResetPassword();
