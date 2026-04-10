import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://matyjysinegbibdwzhoq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_vi6890ktDX5SceFPvzNF_w_B5_ze28O';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
