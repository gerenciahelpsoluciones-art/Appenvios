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

            const siigoRes = await fetch(`${SIIGO_BASE_URL}/auth`, {
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

        // --- Consulta de Productos (con paginación completa) ---
        if (action === 'products') {
            const token = req.headers.get('x-siigo-token');

            if (!token) {
                return new Response(JSON.stringify({ error: 'Token de Siigo no proporcionado' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const authHeaders = {
                'Authorization': `Bearer ${token}`,
                'Partner-Id': PARTNER_ID,
                'Content-Type': 'application/json',
            };

            // Obtener primera página y total de resultados
            const firstRes = await fetch(`${SIIGO_BASE_URL}/v1/products?page_size=100&page=1`, {
                method: 'GET',
                headers: authHeaders,
            });

            if (!firstRes.ok) {
                const err = await firstRes.json();
                return new Response(JSON.stringify({ error: 'Error al consultar productos', detail: err }), {
                    status: firstRes.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const firstData = await firstRes.json();
            let allResults: any[] = firstData.results || [];

            const totalResults = firstData.pagination?.total_results || allResults.length;
            const pageSize = firstData.pagination?.page_size || 100;
            const totalPages = Math.ceil(totalResults / pageSize);

            console.log(`Siigo: ${totalResults} productos en ${totalPages} páginas`);

            // Traer páginas restantes en paralelo
            if (totalPages > 1) {
                const pagePromises = [];
                for (let page = 2; page <= totalPages; page++) {
                    pagePromises.push(
                        fetch(`${SIIGO_BASE_URL}/v1/products?page_size=100&page=${page}`, {
                            method: 'GET',
                            headers: authHeaders,
                        }).then(r => r.json())
                    );
                }
                const extraPages = await Promise.all(pagePromises);
                for (const pageData of extraPages) {
                    if (pageData.results) allResults = allResults.concat(pageData.results);
                }
            }

            return new Response(JSON.stringify({ results: allResults, total: allResults.length }), {
                status: 200,
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
