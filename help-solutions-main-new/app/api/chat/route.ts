import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://matyjysinegbibdwzhoq.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!GEMINI_KEY) {
  console.error("GEMINI_API_KEY no configurada en variables de entorno");
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY || "");

// Models ordered by preference — 503 (busy) is retriable, 429 (quota=0) is not
const CHAT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"];

const SYSTEM_PROMPT = `Eres Helpi, el asistente virtual experto de Help Soluciones Informáticas, empresa colombiana con 12 años de trayectoria en Bogotá.

SERVICIOS QUE OFRECEMOS:
- Mantenimiento preventivo y correctivo de servidores (rack, torre, blade)
- Infraestructura de redes: cableado estructurado certificado Cat6/Cat6A, fibra óptica, WiFi corporativo
- Ciberseguridad: firewall, monitoreo, auditorías
- Outsourcing TI y renta de equipos (Dell, HP, Lenovo)
- Soporte técnico 24/7 con respuesta en menos de 2 horas
- Videovigilancia (CCTV) y control de acceso
- Migración a la nube y consultoría IT

COBERTURA: Bogotá (presencial) y toda Colombia (remoto)
TELÉFONO: +57 310 2172251
EMAIL: gerencia@helpsoluciones.com.co
CONTACTOS: Juan Pérez (Soporte técnico), Deicy Rodríguez (Ventas y cotizaciones)

INSTRUCCIONES:
- Responde siempre en español colombiano, tono profesional y cercano
- Para cotizaciones: solicita nombre, empresa, teléfono y detalle del requerimiento
- Para soporte urgente: ofrece contacto directo por WhatsApp +57 310 2172251
- Si el cliente pregunta precios: explica que depende del alcance y ofrece agendar una visita diagnóstico sin costo
- Máximo 3 oraciones por respuesta — conciso y útil
- Si no puedes ayudar, dirige a gerencia@helpsoluciones.com.co`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function generateWithFallback(prompt: string): Promise<string> {
  for (let m = 0; m < CHAT_MODELS.length; m++) {
    const modelId = CHAT_MODELS[m];
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await genAI.getGenerativeModel({ model: modelId }).generateContent(prompt);
        console.log(`[Helpi] OK with ${modelId} (attempt ${attempt + 1})`);
        return result.response.text();
      } catch (e: any) {
        const status = e?.status as number | undefined;
        console.warn(`[Helpi] ${modelId} attempt ${attempt + 1} → ${status ?? "error"}`);
        // Quota=0 or not found → skip to next model immediately
        if (status === 429 || status === 404) break;
        // Busy (503/500) → retry after short delay, unless last attempt
        if (attempt < 2) await sleep(1500);
      }
    }
  }
  throw new Error("All models unavailable");
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;
    const historyText = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Cliente' : 'Helpi'}: ${m.content}`)
      .join("\n");

    const prompt = `${SYSTEM_PROMPT}\n\nHistorial de conversación:\n${historyText}\n\nHelpi:`;
    const responseText = await generateWithFallback(prompt);

    const hasContactSignal = /\d{7,}|@|\bllamo\b|\bsoy\b|\bme llamo\b|\bnombre\b|\bempresa\b/i.test(lastMessage);
    if (hasContactSignal && SB_KEY) {
      extractAndSaveLead(historyText, lastMessage, SB_KEY).catch(() => {});
    }

    return NextResponse.json({ content: responseText });

  } catch (error: any) {
    console.error("Chat API error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Lo sentimos, tuvimos un problema técnico. Contáctenos por WhatsApp: +57 310 2172251" },
      { status: 500 }
    );
  }
}

async function extractAndSaveLead(history: string, lastMessage: string, sbKey: string) {
  try {
    const extractor = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `Analiza esta conversación y extrae datos de contacto si existen.
Responde SOLO con JSON válido: {"nombre":"...","telefono":"...","empresa":"...","email":"...","requerimiento":"..."}
Usa null si el dato no existe. No inventes datos.

Conversación:
${history}
Último mensaje: "${lastMessage}"`;

    const extResult = await extractor.generateContent(prompt);
    const text = extResult.response.text();
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return;

    const data = JSON.parse(jsonMatch[0]);
    if (!data.nombre && !data.telefono && !data.email) return;

    await fetch(`${SB_URL}/rest/v1/clientes_web`, {
      method: 'POST',
      headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        nombre: data.nombre || null,
        telefono: data.telefono || null,
        empresa: data.empresa || null,
        email: data.email || null,
        requerimiento: data.requerimiento || lastMessage,
      }),
    });
  } catch { /* lead extraction is best-effort */ }
}
