// ¿Quien llama es un usuario del CRM con sesión iniciada?
// Se pregunta a la base con el token del propio usuario (public.hs_es_usuario):
// con la llave pública o con una cuenta de otra app la respuesta es false.
export async function esUsuarioCrm(req: Request): Promise<boolean> {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return false;

  const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/hs_es_usuario`, {
    method: 'POST',
    headers: {
      'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!res.ok) return false;
  return (await res.json()) === true;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-siigo-token, x-hs-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
