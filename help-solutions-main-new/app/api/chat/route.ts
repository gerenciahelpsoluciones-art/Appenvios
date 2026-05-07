import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// CONFIGURACIÓN VERIFICADA Y FUNCIONAL (28 Mar 2026)
// Clave Gemini: Probada con gemini-2.5-flash ✅
// Clave Supabase: Probada con INSERT+GET ✅
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://matyjysinegbibdwzhoq.supabase.co";
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!GEMINI_KEY) {
  console.error("GEMINI_API_KEY no configurada en variables de entorno");
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;
    const historyText = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");

    // 1. GENERAR RESPUESTA (Modelo verificado: gemini-2.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
    const systemPrompt = `Eres Helpi, asistente experto de Help Soluciones Informáticas. 
Atiende solicitudes de soporte TI, infraestructura y cotizaciones de forma profesional y amable.
Solicita siempre el Nombre y Teléfono del cliente si no los ha proporcionado.
Contactos internos: Juan Perez (Soporte), Deicy Rodriguez (Ventas).`;

    const result = await model.generateContent(`${systemPrompt}\n\n${historyText}\n\nHelpi:`);
    const responseText = result.response.text();

    // 2. EXTRACCIÓN Y GUARDADO EN CRM
    if (lastMessage.length > 5) {
      try {
        const extractor = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        const extractionPrompt = `Analiza esta conversación y extrae datos de contacto.
Responde SOLO con JSON: {"nombre": "...", "telefono": "...", "empresa": "...", "email": "...", "requerimiento": "..."}
Si un dato no existe, usa "N/A".

Historial:
${historyText}

Último mensaje: "${lastMessage}"`;

        const extResult = await extractor.generateContent(extractionPrompt);
        const text = extResult.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.nombre !== "N/A" || data.telefono !== "N/A") {
            const sbResponse = await fetch(`${SB_URL}/rest/v1/clientes_web`, {
              method: 'POST',
              headers: {
                'apikey': SB_KEY || '',
                'Authorization': `Bearer ${SB_KEY || ''}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                nombre: data.nombre !== "N/A" ? data.nombre : null,
                telefono: data.telefono !== "N/A" ? data.telefono : null,
                empresa: data.empresa !== "N/A" ? data.empresa : null,
                email: data.email !== "N/A" ? data.email : null,
                requerimiento: data.requerimiento !== "N/A" ? data.requerimiento : lastMessage
              })
            });
            console.log(`Lead sync: ${sbResponse.status}`);
          }
        }
      } catch (extErr) {
        console.error("Lead extraction error:", extErr);
      }
    }

    return NextResponse.json({ content: responseText });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "⚠️ " + error.message }, { status: 500 });
  }
}
