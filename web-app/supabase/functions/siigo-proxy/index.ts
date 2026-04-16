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

            // Obtener primera página (sin filtros para ver qué devuelve)
            const firstRes = await fetch(`${SIIGO_BASE_URL}/v1/products?page_size=100`, {
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
            // Filtrar productos con stock > 0 directamente en el proxy
            let allResults: any[] = (firstData.results || []).filter((p: any) => p.stock_control && p.available_quantity >= 1);

            // DEBUG: Loguear estructura del primer producto para diagnóstico
            if (allResults.length > 0) {
                const sample = allResults[0];
                console.log('=== SIIGO PRODUCT SAMPLE KEYS ===', JSON.stringify(Object.keys(sample)));
                console.log('=== SIIGO PRODUCT SAMPLE (primeros campos) ===', JSON.stringify({
                    id: sample.id,
                    code: sample.code,
                    name: sample.name,
                    description: sample.description,
                    unit_label: sample.unit_label,
                    account_group: sample.account_group,
                    type: sample.type,
                    stock_control: sample.stock_control,
                    available_quantity: sample.available_quantity,
                    prices: sample.prices,
                    costs: sample.costs,
                    unit_cost: sample.unit_cost,
                }));
            }

            const totalResults = firstData.pagination?.total_results || allResults.length;
            const pageSize = firstData.pagination?.page_size || 100;
            const totalPages = Math.ceil(totalResults / pageSize);

            console.log(`Siigo: ${totalResults} productos en ${totalPages} páginas`);

            // Traer páginas restantes en bloques (chunks) para no saturar memoria/sockets
            if (totalPages > 1) {
                const chunkSize = 10;
                for (let i = 2; i <= totalPages; i += chunkSize) {
                    const chunkPromises = [];
                    for (let page = i; page < i + chunkSize && page <= totalPages; page++) {
                        chunkPromises.push(
                            fetch(`${SIIGO_BASE_URL}/v1/products?page_size=100&page=${page}`, {
                                method: 'GET',
                                headers: authHeaders,
                            }).then(async r => {
                                if (!r.ok) return { results: [] };
                                const text = await r.text();
                                try {
                                    return JSON.parse(text);
                                } catch {
                                    return { results: [] };
                                }
                            })
                        );
                    }
                    const chunkResults = await Promise.all(chunkPromises);
                    for (const pageData of chunkResults) {
                        if (pageData.results) {
                            const filteredChunk = pageData.results.filter((p: any) => p.stock_control && p.available_quantity >= 1);
                            allResults = allResults.concat(filteredChunk);
                        }
                    }
                }
            }

            return new Response(JSON.stringify({
                results: allResults,
                total: allResults.length,
                pagination: firstData.pagination,
                _sample: allResults.length > 0 ? allResults[0] : null,
                _debug_first_raw: firstData,
                _debug_info: {
                    totalResults,
                    totalPages,
                    allResultsCount: allResults.length,
                    partnerId: PARTNER_ID
                }
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Consulta de Facturas (con filtro de fecha) ---
        if (action === 'invoices') {
            const token = req.headers.get('x-siigo-token');
            const start = url.searchParams.get('created_start');
            const end = url.searchParams.get('created_end');

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

            let query = `${SIIGO_BASE_URL}/v1/invoices?page_size=100`;
            if (start) query += `&created_start=${start}`;
            if (end) query += `&created_end=${end}`;

            console.log(`Consultando facturas: ${query}`);

            const response = await fetch(query, {
                method: 'GET',
                headers: authHeaders,
            });

            if (!response.ok) {
                const err = await response.json();
                return new Response(JSON.stringify({ error: 'Error al consultar facturas', detail: err }), {
                    status: response.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const data = await response.json();
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Consulta de Usuarios/Vendedores (Con paginación) ---
        if (action === 'users') {
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

            const firstRes = await fetch(`${SIIGO_BASE_URL}/v1/users?page_size=100`, {
                method: 'GET',
                headers: authHeaders,
            });

            if (!firstRes.ok) {
                const err = await firstRes.json();
                return new Response(JSON.stringify({ error: 'Error al consultar usuarios', detail: err }), {
                    status: firstRes.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const firstData = await firstRes.json();
            let allResults = firstData.results || [];

            // Si hay más páginas, traerlas
            const totalPages = firstData.pagination?.total_pages || 1;
            if (totalPages > 1) {
                for (let page = 2; page <= totalPages; page++) {
                    try {
                        const nextRes = await fetch(`${SIIGO_BASE_URL}/v1/users?page_size=100&page=${page}`, {
                            headers: authHeaders
                        });
                        if (nextRes.ok) {
                            const nextData = await nextRes.json();
                            allResults = [...allResults, ...(nextData.results || [])];
                        }
                    } catch (e) {
                        console.error(`Error cargando página ${page} de usuarios:`, e);
                    }
                }
            }

            return new Response(JSON.stringify(allResults), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Consulta de Centros de Costo (Con paginación) ---
        if (action === 'cost-centers') {
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

            const firstRes = await fetch(`${SIIGO_BASE_URL}/v1/cost-centers?page_size=100`, {
                method: 'GET',
                headers: authHeaders,
            });

            if (!firstRes.ok) {
                const err = await firstRes.json();
                return new Response(JSON.stringify({ error: 'Error al consultar centros de costo', detail: err }), {
                    status: firstRes.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const firstData = await firstRes.json();
            let allResults = firstData.results || [];

            const totalPages = firstData.pagination?.total_pages || 1;
            if (totalPages > 1) {
                for (let page = 2; page <= totalPages; page++) {
                    try {
                        const nextRes = await fetch(`${SIIGO_BASE_URL}/v1/cost-centers?page_size=100&page=${page}`, {
                            headers: authHeaders
                        });
                        if (nextRes.ok) {
                            const nextData = await nextRes.json();
                            allResults = [...allResults, ...(nextData.results || [])];
                        }
                    } catch (e) {
                        console.error(`Error cargando página ${page} de centros de costo:`, e);
                    }
                }
            }

            return new Response(JSON.stringify(allResults), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Consulta de Detalle de Factura ---
        if (action === 'invoice-detail') {
            const token = req.headers.get('x-siigo-token');
            const invoiceId = url.searchParams.get('id');

            if (!token || !invoiceId) {
                return new Response(JSON.stringify({ error: 'Falta token o ID de factura' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const authHeaders = {
                'Authorization': `Bearer ${token}`,
                'Partner-Id': PARTNER_ID,
                'Content-Type': 'application/json',
            };

            const response = await fetch(`${SIIGO_BASE_URL}/v1/invoices/${invoiceId}`, {
                method: 'GET',
                headers: authHeaders,
            });

            if (!response.ok) {
                const err = await response.json();
                return new Response(JSON.stringify({ error: 'Error al consultar detalle', detail: err }), {
                    status: response.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            const data = await response.json();
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Consulta de Facturas de Compra ---
        if (action === 'purchases') {
            const token = req.headers.get('x-siigo-token');
            const start = url.searchParams.get('created_start');
            const end = url.searchParams.get('created_end');

            if (!token) return new Response(JSON.stringify({ error: 'Falta token' }), { status: 401, headers: corsHeaders });

            const authHeaders = {
                'Authorization': `Bearer ${token}`,
                'Partner-Id': PARTNER_ID,
                'Content-Type': 'application/json',
            };

            let query = `${SIIGO_BASE_URL}/v1/purchases?page_size=100`;
            if (start) query += `&created_start=${start}`;
            if (end) query += `&created_end=${end}`;

            const res = await fetch(query, { method: 'GET', headers: authHeaders });
            const data = await res.json();
            return new Response(JSON.stringify(data), {
                status: res.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Consulta Masiva de Centros de Costo ---
        if (action === 'cost-centers') {
            const token = req.headers.get('x-siigo-token');
            if (!token) return new Response(JSON.stringify({ error: 'Falta token' }), { status: 401, headers: corsHeaders });

            const authHeaders = {
                'Authorization': `Bearer ${token}`,
                'Partner-Id': PARTNER_ID,
                'Content-Type': 'application/json',
            };

            const query = `${SIIGO_BASE_URL}/v1/cost-centers?page_size=100`;
            const res = await fetch(query, { method: 'GET', headers: authHeaders });
            const data = await res.json();
            return new Response(JSON.stringify(data), {
                status: res.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Consulta de Documentos Soporte (Bills) ---
        if (action === 'bills') {
            const token = req.headers.get('x-siigo-token');
            const start = url.searchParams.get('created_start');
            const end = url.searchParams.get('created_end');

            if (!token) return new Response(JSON.stringify({ error: 'Falta token' }), { status: 401, headers: corsHeaders });

            const authHeaders = {
                'Authorization': `Bearer ${token}`,
                'Partner-Id': PARTNER_ID,
                'Content-Type': 'application/json',
            };

            let query = `${SIIGO_BASE_URL}/v1/bills?page_size=100`;
            if (start) query += `&created_start=${start}`;
            if (end) query += `&created_end=${end}`;

            const res = await fetch(query, { method: 'GET', headers: authHeaders });
            const data = await res.json();
            return new Response(JSON.stringify(data), {
                status: res.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // --- Consulta de ID Específico (Súrgico) ---
        if (action === 'cost-center-detail' || action === 'user-detail') {
            const token = req.headers.get('x-siigo-token');
            const id = url.searchParams.get('id');
            const endpoint = action === 'cost-center-detail' ? 'cost-centers' : 'users';

            if (!token || !id) return new Response(JSON.stringify({ error: 'Falta ID' }), { status: 400, headers: corsHeaders });

            const res = await fetch(`${SIIGO_BASE_URL}/v1/${endpoint}/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Partner-Id': PARTNER_ID, 'Content-Type': 'application/json' },
            });

            const data = await res.json();
            return new Response(JSON.stringify(data), {
                status: res.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Acción no reconocida. Use ?action=auth, ?action=products, ?action=invoices, ?action=users, ?action=cost-centers, ?action=invoice-detail, ?action=cost-center-detail o ?action=user-detail' }), {
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
