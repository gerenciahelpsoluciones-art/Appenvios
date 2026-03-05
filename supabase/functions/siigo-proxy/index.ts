// supabase/functions/siigo-proxy/index.ts
// Edge Function que actua como proxy para la API de Siigo Nube
// Elimina el problema de CORS al hacer las peticiones desde el servidor.

const SIIGO_BASE_URL = 'https://api.siigo.com';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-siigo-token, x-siigo-username, x-siigo-key',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');

        // --- ACTION: auth ---
        if (action === 'auth') {
            const { username, access_key } = await req.json();

            if (!username || !access_key) {
                return new Response(JSON.stringify({ error: 'Faltan credenciales' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const siigoRes = await fetch(`${SIIGO_BASE_URL}/v1/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, access_key }),
            });

            const data = await siigoRes.json();

            if (!siigoRes.ok) {
                return new Response(JSON.stringify({ error: 'Credenciales inválidas', detail: data }), {
                    status: siigoRes.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- ACTION: products ---
        if (action === 'products') {
            const token = req.headers.get('x-siigo-token');

            if (!token) {
                return new Response(JSON.stringify({ error: 'Token no proporcionado' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const siigoRes = await fetch(`${SIIGO_BASE_URL}/v1/products`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Partner-Id': 'AppEnviosHelpSoluciones',
                    'Content-Type': 'application/json',
                },
            });

            const data = await siigoRes.json();

            return new Response(JSON.stringify(data), {
                status: siigoRes.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Acción no reconocida. Use ?action=auth o ?action=products' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: 'Error interno en la función proxy', detail: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
