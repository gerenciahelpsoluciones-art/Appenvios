import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://matyjysinegbibdwzhoq.supabase.co';
const SERVICE_KEY = 'sb_secret_vi6890ktDX5SceFPvzNF_w_B5_ze28O';
const ANON_KEY = 'sb_publishable_Y0VR9m4LtJRlSoKRq_c3OQ_10ViUr3n';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const FINAL_PASSWORD = 'admin'; // User requested "clave de admin", let's try to set it to 'admin' if possible, or 'admin123'

async function finalReset() {
  const USER_ID = 'ef955d9c-c7f2-4596-99db-c077d34c01c1'; // admin@velia.com

  console.log('🔄 Seteando contraseña a "admin123" (mínimo 6 caracteres)...');

  const { data, error } = await adminClient.auth.admin.updateUserById(USER_ID, {
    password: 'admin123',
    email_confirm: true
  });

  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Contraseña reseteada a: admin123');
    
    // Probar login
    const testClient = createClient(SUPABASE_URL, ANON_KEY);
    const { error: loginErr } = await testClient.auth.signInWithPassword({
      email: 'admin@velia.com',
      password: 'admin123'
    });

    if (loginErr) {
      console.log('❌ Login sigue fallando en API:', loginErr.message);
    } else {
      console.log('✅ Login EXITOSO en API con admin123');
    }
  }
}

finalReset();
