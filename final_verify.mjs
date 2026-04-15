
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://matyjysinegbibdwzhoq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFlow() {
  console.log('--- Final Flow Verification ---');
  try {
    // 1. Check current count
    const { count: initialCount } = await supabase
      .from('visitantes_web')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Initial count: ${initialCount}`);

    // 2. Insert test visitor
    const { error: insError } = await supabase
      .from('visitantes_web')
      .insert([{ path: '/test-verification-final', device: 'Script', location: 'Internal' }]);

    if (insError) {
      console.error('❌ Insert failed:', insError.message);
      return;
    }
    console.log('✅ Insert successful!');

    // 3. Verify new count
    const { count: finalCount } = await supabase
      .from('visitantes_web')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Final count: ${finalCount}`);

    if (finalCount > initialCount) {
      console.log('🚀 SUCCESS: Tracking flow verified end-to-end!');
    } else {
      console.log('❌ FAILURE: Count did not increase.');
    }
  } catch (e) {
    console.error('❌ Critical Error:', e);
  }
}

verifyFlow();
