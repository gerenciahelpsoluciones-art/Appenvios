// supabase/functions/extraer-slas/index.ts
// Lee un RFP / solicitud del cliente con Gemini y devuelve los Acuerdos de Niveles
// de Servicio (SLA/ANS) en formato tabla para la propuesta de Mesa de Ayuda.
// La API key vive como secreto del proyecto (GEMINI_API_KEY), nunca en el navegador.

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const MAX_BASE64_CHARS = 14_000_000; // ~10 MB de PDF
const MAX_TEXT_CHARS = 400_000;

const PROMPT = `Eres analista de licitaciones de una empresa colombiana de soporte técnico (Help Soluciones).
Del documento adjunto (RFP, pliego, invitación o solicitud del cliente para un servicio de Mesa de Ayuda / soporte técnico),
extrae TODOS los Acuerdos de Niveles de Servicio (SLA / ANS) que el cliente exige.

Reglas:
- Una fila por nivel de prioridad/criticidad o por tipo de requerimiento con tiempo propio.
- "tiempoRespuesta" y "tiempoSolucion" tal como los pide el documento (ej. "<= 30 min", "4 horas hábiles"). Si no se indica, usa "No especificado".
- "canal": remoto, sitio, portal, teléfono, etc., si se menciona; si no, "No especificado".
- "notas": condiciones generales de los ANS (horario de cobertura, disponibilidad %, penalidades o descuentos por incumplimiento, forma de medición, nivel de servicio 1/2/3, reportes exigidos). Frases cortas y concretas.
- "fuente": sección, numeral o página donde aparecen los SLA, si se puede identificar.
- No inventes valores que no estén en el documento. Si el documento no contiene SLA, devuelve "filas" vacío y explícalo en "notas".
- Responde en español.`;

const SCHEMA = {
    type: 'OBJECT',
    properties: {
        filas: {
            type: 'ARRAY',
            items: {
                type: 'OBJECT',
                properties: {
                    criticidad: { type: 'STRING' },
                    descripcion: { type: 'STRING' },
                    tiempoRespuesta: { type: 'STRING' },
                    tiempoSolucion: { type: 'STRING' },
                    canal: { type: 'STRING' },
                },
                required: ['criticidad', 'descripcion', 'tiempoRespuesta', 'tiempoSolucion', 'canal'],
            },
        },
        notas: { type: 'ARRAY', items: { type: 'STRING' } },
        fuente: { type: 'STRING' },
    },
    required: ['filas', 'notas'],
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'Falta configurar GEMINI_API_KEY en los secretos de Supabase.' }, 500);
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

    let body: { mimeType?: string; base64?: string; text?: string; fileName?: string };
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Cuerpo de la solicitud inválido' }, 400);
    }

    // Validación de entrada: o un PDF en base64, o texto ya extraído (Word/TXT)
    const parts: unknown[] = [];
    if (body.base64) {
        if (body.mimeType !== 'application/pdf') return json({ error: 'Solo se aceptan PDF en base64' }, 400);
        if (body.base64.length > MAX_BASE64_CHARS) return json({ error: 'El PDF supera 10 MB' }, 413);
        parts.push({ inline_data: { mime_type: 'application/pdf', data: body.base64 } });
    } else if (body.text && body.text.trim()) {
        parts.push({ text: `Documento "${body.fileName || 'RFP'}":\n\n${body.text.slice(0, MAX_TEXT_CHARS)}` });
    } else {
        return json({ error: 'No se recibió contenido del documento' }, 400);
    }
    parts.push({ text: PROMPT });

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema: SCHEMA },
            }),
        });

        if (!res.ok) {
            const detail = await res.text();
            console.error('Gemini error', res.status, detail.slice(0, 500));
            return json({ error: `El servicio de IA respondió ${res.status}` }, 502);
        }

        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
        const parsed = JSON.parse(raw);
        return json({
            filas: Array.isArray(parsed.filas) ? parsed.filas : [],
            notas: Array.isArray(parsed.notas) ? parsed.notas : [],
            fuente: parsed.fuente || '',
        });
    } catch (e) {
        console.error('extraer-slas', e);
        return json({ error: 'No se pudo analizar el documento' }, 500);
    }
});
