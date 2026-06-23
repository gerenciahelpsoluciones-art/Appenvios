import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SUPABASE_URL) || 'https://sdpvvzwxiymufpajqkbi.supabase.co';
const supabaseAnonKey = (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_B5P_DbRAxEMw82Go1Lgkpg_of-cj7u_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
