// supabase/functions/siigo-proxy/index.ts
// Proxy de solo lectura para la API de Siigo Nube.
// - Solo atiende a usuarios del CRM con sesión (Authorization: Bearer <token de la sesión>).
// - Las credenciales de Siigo son secretos de la función (SIIGO_USERNAME, SIIGO_ACCESS_KEY):
//   el navegador nunca las ve ni recibe el token de Siigo.
import { corsHeaders, esUsuarioCrm, json } from '../_shared/crm-auth.ts';

const SIIGO_BASE_URL = 'https://api.siigo.com';
const PARTNER_ID = 'AppEnvios';

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
    'products': '/v1/products',
    'customers': '/v1/customers',
    'purchase-support-documents': '/v1/purchase-support-documents',
    'purchase-support-document-detail': '/v1/purchase-support-documents',
};

// Token de Siigo en memoria de la función; Siigo lo da por 24 h, se renueva antes
let siigoToken: { valor: string; vence: number } | null = null;

async function obtenerToken(forzar = false): Promise<string> {
    if (!forzar && siigoToken && Date.now() < siigoToken.vence) return siigoToken.valor;

    const username = Deno.env.get('SIIGO_USERNAME');
    const access_key = Deno.env.get('SIIGO_ACCESS_KEY');
    if (!username || !access_key) throw new Error('Faltan los secretos SIIGO_USERNAME / SIIGO_ACCESS_KEY');

    const res = await fetch(`${SIIGO_BASE_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Partner-Id': PARTNER_ID },
        body: JSON.stringify({ username, access_key }),
    });
    if (!res.ok) throw new Error(`Siigo rechazó la autenticación (HTTP ${res.status})`);

    const data = await res.json();
    siigoToken = { valor: data.access_token, vence: Date.now() + 20 * 60 * 60 * 1000 };
    return siigoToken.valor;
}

function construirUrl(action: string, url: URL): string | null {
    let siigoUrl = `${SIIGO_BASE_URL}${endpointMap[action]}`;
    const id = url.searchParams.get('id');

    if (action.endsWith('-detail')) {
        if (!id || !/^[A-Za-z0-9-]+$/.test(id)) return null;
        return `${siigoUrl}/${id}`;
    }
    const siigoParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
        if (key !== 'action' && key !== 'id') siigoParams.append(key, value);
    });
    if (siigoParams.toString()) siigoUrl += `?${siigoParams.toString()}`;
    return siigoUrl;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    if (!(await esUsuarioCrm(req))) return json({ error: 'No autorizado' }, 401);

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action') ?? '';

        // Compatibilidad: los módulos piden 'auth' antes de consultar. Ya no hay
        // credenciales que validar en el navegador; se confirma que Siigo responde.
        if (action === 'auth') {
            await obtenerToken();
            return json({ access_token: 'servidor' });
        }

        if (!endpointMap[action]) return json({ error: 'Acción no reconocida' }, 400);
        const siigoUrl = construirUrl(action, url);
        if (!siigoUrl) return json({ error: 'id inválido' }, 400);

        const consultar = async (token: string) => fetch(siigoUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Partner-Id': PARTNER_ID, 'Content-Type': 'application/json' },
        });

        let siigoRes = await consultar(await obtenerToken());
        if (siigoRes.status === 401) siigoRes = await consultar(await obtenerToken(true));

        const rawText = await siigoRes.text();
        console.log(`Siigo ${action} HTTP ${siigoRes.status}`);

        let data: unknown;
        try {
            data = JSON.parse(rawText);
        } catch {
            data = { error: 'Siigo devolvió respuesta no-JSON', status: siigoRes.status };
        }
        return json(data, siigoRes.status);
    } catch (err: any) {
        console.error('Error en la función proxy:', err.message);
        return json({ error: 'Error interno en el proxy', detail: err.message }, 500);
    }
});
