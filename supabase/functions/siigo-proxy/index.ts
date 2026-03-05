// supabase/functions/siigo-proxy/index.ts
// Proxy seguro para la API de Siigo Nube - Elimina problemas de CORS

const SIIGO_BASE_URL = 'https://api.siigo.com';
const PARTNER_ID = 'AppEnviosHelpSoluciones';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-siigo-token',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');

        // --- Autenticación ---
        if (action === 'auth') {
            const { username, access_key } = await req.json();

            if (!username || !access_key) {
                return new Response(JSON.stringify({ error: 'Faltan credenciales (username y access_key)' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            console.log(`Autenticando usuario: ${username}`);

            const siigoRes = await fetch(`${SIIGO_BASE_URL}/v1/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Partner-Id': PARTNER_ID,
                },
                body: JSON.stringify({ username, access_key }),
            });

            const responseText = await siigoRes.text();
            console.log(`Siigo auth status: ${siigoRes.status}, body: ${responseText}`);

            let data: any;
            try {
                data = JSON.parse(responseText);
            } catch {
                data = { raw: responseText };
            }

            if (!siigoRes.ok) {
                return new Response(JSON.stringify({
                    error: `Siigo rechazó las credenciales (HTTP ${siigoRes.status})`,
                    siigoDetail: data,
                    hint: siigoRes.status === 404
                        ? 'La cuenta no tiene acceso a la API de Siigo, o el plan no incluye la funcionalidad. Verifique en Siigo > Configuración > Alianzas > Mi Credencial API.'
                        : 'Verifique que el usuario y access_key sean correctos.'
                }), {
                    status: siigoRes.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Consulta de Productos ---
        if (action === 'products') {
            const token = req.headers.get('x-siigo-token');

            if (!token) {
                return new Response(JSON.stringify({ error: 'Token de Siigo no proporcionado' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const siigoRes = await fetch(`${SIIGO_BASE_URL}/v1/products`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Partner-Id': PARTNER_ID,
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
        console.error('Error en la función proxy:', err.message);
        return new Response(JSON.stringify({ error: 'Error interno en el proxy', detail: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
