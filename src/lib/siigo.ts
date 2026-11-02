import { supabase } from './supabaseClient';

// Las credenciales de Siigo viven como secretos de la función siigo-proxy (SIIGO_USERNAME,
// SIIGO_ACCESS_KEY). El navegador solo manda la sesión del usuario del CRM.
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const SIIGO_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/siigo-proxy`;

// Versiones anteriores guardaban la clave de Siigo en cada navegador: se borra
localStorage.removeItem('siigo_username');
localStorage.removeItem('siigo_access_key');

// Token de la sesión actual, al día con los refrescos automáticos de Supabase Auth
let accessToken: string | null = null;
supabase.auth.getSession().then(({ data }) => { accessToken = data.session?.access_token ?? null; });
supabase.auth.onAuthStateChange((_event, session) => { accessToken = session?.access_token ?? null; });

export const siigoHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${accessToken ?? SUPABASE_ANON_KEY}`,
});
