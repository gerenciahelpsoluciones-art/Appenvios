// supabase/functions/siigo-proxy/index.ts
// Proxy seguro para la API de Siigo Nube - Elimina problemas de CORS

const SIIGO_BASE_URL = 'https://api.siigo.com';
const PARTNER_ID = 'AppEnvios'; // Nombre de aplicación más corto y sin caracteres especiales


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

        // --- Generic Siigo Endpoint Proxy ---
        const token = req.headers.get('x-siigo-token');
        if (token) {
            const authHeaders = {
                'Authorization': `Bearer ${token}`,
                'Partner-Id': PARTNER_ID,
                'Content-Type': 'application/json',
            };

            const endpointMap: Record<string, string> = {
                'users': '/v1/users',
                'user-detail': '/v1/users',
                'cost-centers': '/v1/cost-centers',
                'cost-center-detail': '/v1/cost-centers',
                'invoices': '/v1/invoices',
                'invoice-detail': '/v1/invoices',
                'credit-notes': '/v1/credit-notes',
                'credit-note-detail': '/v1/credit-notes',
                'purchases': '/v1/purchases',
                'purchase-detail': '/v1/purchases',
                'bills': '/v1/bills',
                'bill-detail': '/v1/bills',
                'debit-notes': '/v1/debit-notes',
                'debit-note-detail': '/v1/debit-notes',
                'products': '/v1/products'
            };

            if (action && endpointMap[action]) {
                let siigoUrl = `${SIIGO_BASE_URL}${endpointMap[action]}`;
                const id = url.searchParams.get('id');
                
                if (id && action.includes('detail')) {
                    siigoUrl += `/${id}`;
                } else {
                    // Forward all other query params except 'action' and 'id'
                    const siigoParams = new URLSearchParams();
                    url.searchParams.forEach((value, key) => {
                        if (key !== 'action' && key !== 'id') {
                            siigoParams.append(key, value);
                        }
                    });
                    if (siigoParams.toString()) {
                        siigoUrl += `?${siigoParams.toString()}`;
                    }
                }

                console.log(`Proxying to Siigo: ${siigoUrl}`);
                const siigoRes = await fetch(siigoUrl, {
                    method: 'GET',
                    headers: authHeaders,
                });

                const data = await siigoRes.json();
                return new Response(JSON.stringify(data), {
                    status: siigoRes.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        return new Response(JSON.stringify({ error: 'Acción no reconocida o Token faltante.' }), {
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
