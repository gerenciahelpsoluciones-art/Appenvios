import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = "gemini-2.5-flash";

const parseJson = (text: string): any => {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("Respuesta sin formato JSON válido");
  return JSON.parse(text.substring(first, last + 1));
};

const parseJsonArray = (text: string): any[] => {
  const first = text.indexOf("[");
  const last = text.lastIndexOf("]");
  if (first === -1 || last === -1) return [];
  return JSON.parse(text.substring(first, last + 1));
};

const askGemini = async (prompt: string): Promise<string> => {
  if (!GEMINI_KEY) throw new Error("VITE_GEMINI_API_KEY no configurada en .env");

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (geminiError: any) {
    console.error("Gemini falló:", geminiError.message);

    if (ANTHROPIC_KEY) {
      try {
        const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY, dangerouslyAllowBrowser: true });
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        });
        const content = message.content[0];
        if ("text" in content) return content.text;
      } catch (anthropicError: any) {
        console.error("Anthropic también falló:", anthropicError.message);
      }
    }

    throw new Error(`Error de IA: ${geminiError.message || "Error desconocido"}`);
  }
};

export const generateMarketingContent = async (prompt: string, platform: string) => {
  const isWhatsApp = platform === "WhatsApp";
  const fullPrompt = isWhatsApp
    ? `Eres experto en comunicación para WhatsApp Business.
Crea un mensaje profesional para Help Soluciones (empresa colombiana de tecnología y soluciones informáticas) sobre: ${prompt}
El mensaje debe ser conversacional, sin hashtags excesivos, con emojis moderados.
Responde ÚNICAMENTE con JSON válido: {"title": "...", "copy": "...", "hashtags": []}`
    : `Eres experto en Marketing Digital para ${platform}.
Crea un post de alto impacto para Help Soluciones (empresa colombiana de TI) sobre: ${prompt}
Adapta el tono y formato a ${platform}. Usa emojis apropiados. Máximo 3 hashtags relevantes en español.
Responde ÚNICAMENTE con JSON válido: {"title": "...", "copy": "...", "hashtags": ["#tag1", "#tag2"]}`;

  const text = await askGemini(fullPrompt);
  return parseJson(text);
};

export const analyzeCompetitor = async (name: string, web: string) => {
  const prompt = `Eres analista de inteligencia competitiva para empresas de tecnología en Colombia.
Analiza este competidor de Help Soluciones (empresa de soluciones informáticas en Colombia):
- Nombre: ${name}
- Web: ${web}

Basándote en lo que conoces de empresas similares en el mercado colombiano de TI, proporciona un análisis estratégico.
Responde ÚNICAMENTE con JSON válido:
{
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "weaknesses": ["debilidad 1", "debilidad 2"],
  "differentiator": "qué los hace diferentes",
  "threatLevel": "Alto|Medio|Bajo",
  "marketStrategy": "descripción de su estrategia de mercado en 2-3 oraciones",
  "opportunities": ["oportunidad para nosotros 1", "oportunidad 2"]
}`;

  const text = await askGemini(prompt);
  return parseJson(text);
};

export const optimizeGoogleBusiness = async (info: string) => {
  const prompt = `Eres experto en Google My Business y SEO local para empresas de tecnología en Colombia.
Optimiza el perfil de Google Business para una empresa con esta información:
${info}

Proporciona recomendaciones específicas y accionables para el mercado colombiano.
Responde ÚNICAMENTE con JSON válido:
{
  "keywords": ["keyword local 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"],
  "description": "descripción optimizada de 150-200 palabras para el perfil",
  "postIdea": {
    "title": "título del post sugerido",
    "content": "contenido del post de 100-150 palabras"
  },
  "categories": ["categoría principal", "categoría secundaria"],
  "tips": ["tip de optimización 1", "tip 2", "tip 3"]
}`;

  const text = await askGemini(prompt);
  return parseJson(text);
};

export const analyzeRentalService = async (eq: string, quantity = 1, durationMonths = 1) => {
  const prompt = `Eres consultor de pricing para servicios de renta de equipos tecnológicos en Colombia.
Analiza el mercado para:
- Equipo: ${eq}
- Cantidad: ${quantity} unidades
- Duración del contrato: ${durationMonths} meses

Considera el mercado colombiano, precios en COP, y estrategia competitiva para una empresa de soluciones informáticas.
Responde ÚNICAMENTE con JSON válido:
{
  "suggestedPrice": "precio unitario mensual en COP (ej: $280.000 - $350.000 COP/mes)",
  "marketVibe": "descripción del estado del mercado (1 oración)",
  "sellingPoints": ["punto de venta 1", "punto de venta 2", "punto de venta 3"],
  "strategy": "estrategia recomendada de pricing y posicionamiento (2-3 oraciones)",
  "targetClients": ["tipo de cliente ideal 1", "tipo 2"],
  "competitiveAdvantage": "ventaja competitiva principal a destacar"
}`;

  const text = await askGemini(prompt);
  return parseJson(text);
};

export const sendToN8n = async (data: any) => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  if (!webhookUrl) return { success: false, error: "VITE_N8N_WEBHOOK_URL no configurada" };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return { success: res.ok, status: res.status };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getTrendingAdvice = async () => {
  const prompt = `Eres estratega de marketing digital especializado en el mercado colombiano de tecnología y servicios de TI.
Identifica las 5 tendencias más relevantes de marketing digital para empresas de tecnología en Colombia en este momento (Mayo 2025).

Considera: IA generativa, automatización, transformación digital de PYMEs colombianas, LinkedIn B2B, WhatsApp Business.
Responde ÚNICAMENTE con un array JSON válido:
[
  {
    "trend": "nombre de la tendencia",
    "description": "descripción y por qué es relevante para el mercado colombiano (2-3 oraciones)",
    "actionableIdea": "idea concreta de contenido o campaña para implementar",
    "platform": "plataforma principal (LinkedIn|Instagram|WhatsApp|TikTok|Blog)",
    "priority": "Alta|Media|Baja"
  }
]`;

  const text = await askGemini(prompt);
  return parseJsonArray(text);
};

export const analyzeSeo = async (url: string) => {
  const PAGESPEED_KEY = import.meta.env.VITE_PAGESPEED_API_KEY;
  let pagespeedData = null;

  if (PAGESPEED_KEY) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${PAGESPEED_KEY}&strategy=mobile`
      );
      pagespeedData = await res.json();
    } catch {
      // Continúa sin datos de PageSpeed
    }
  }

  const lcp = pagespeedData?.lighthouseResult?.audits?.["largest-contentful-paint"]?.displayValue || "N/A";
  const score = Math.round((pagespeedData?.lighthouseResult?.categories?.performance?.score || 0) * 100);

  const prompt = `Eres experto en SEO técnico y posicionamiento web para empresas colombianas.
Analiza el sitio web: ${url}
${pagespeedData ? `Datos reales de PageSpeed: LCP=${lcp}, Score de rendimiento=${score}/100` : ""}

Proporciona un análisis SEO completo y recomendaciones accionables para el mercado colombiano.
Responde ÚNICAMENTE con JSON válido:
{
  "score": ${score || 65},
  "loadTime": "${lcp !== "N/A" ? lcp : "estimado 2.8s"}",
  "metaTagsScore": número del 0 al 100,
  "recommendations": [
    {"priority": "Alta|Media|Baja", "issue": "problema encontrado", "fix": "cómo solucionarlo"},
    {"priority": "Alta", "issue": "...", "fix": "..."},
    {"priority": "Media", "issue": "...", "fix": "..."},
    {"priority": "Media", "issue": "...", "fix": "..."},
    {"priority": "Baja", "issue": "...", "fix": "..."}
  ],
  "keywordSuggestions": ["keyword relevante 1", "keyword 2", "keyword 3"],
  "technicalIssues": ["problema técnico 1", "problema 2"]
}`;

  const text = await askGemini(prompt);
  return parseJson(text);
};

export const huntLeads = async (sector: string, location: string) => {
  const prompt = `Eres especialista en prospección B2B para empresas de tecnología en Colombia.
Genera una lista de 8 prospectos empresariales ideales para Help Soluciones (empresa de soluciones informáticas) en:
- Sector: ${sector}
- Ubicación: ${location}

Crea prospectos realistas del mercado colombiano que necesiten servicios de TI, digitalización o soluciones informáticas.
Responde ÚNICAMENTE con un array JSON válido:
[
  {
    "company": "nombre de empresa realista",
    "sector": "${sector}",
    "size": "Pequeña|Mediana|Grande",
    "location": "${location}",
    "contact": "cargo del contacto ideal (ej: Gerente de TI)",
    "painPoint": "principal dolor o necesidad tecnológica",
    "opportunity": "oportunidad específica para Help Soluciones",
    "priority": "Alta|Media|Baja",
    "estimatedBudget": "rango estimado en COP"
  }
]`;

  const text = await askGemini(prompt);
  return parseJsonArray(text);
};

export const suggestReply = async (comment: string, platform = 'Redes Sociales') => {
  const prompt = `Eres community manager experto para una empresa colombiana de tecnología y soluciones informáticas.
Analiza este comentario recibido en ${platform} y genera una respuesta profesional:
"${comment}"

La respuesta debe ser empática, profesional, en español colombiano, y orientada a generar conversación o llevar al cliente al siguiente paso.
Responde ÚNICAMENTE con JSON válido:
{
  "reply": "respuesta sugerida (máximo 3 oraciones, tono profesional y cercano)",
  "sentiment": "Positivo|Negativo|Neutro|Consulta",
  "actionNeeded": "Sí|No",
  "suggestedAction": "si actionNeeded es Sí, describe qué acción tomar (ej: contactar por DM, escalar a soporte)",
  "tone": "Formal|Conversacional|Empático"
}`;

  const text = await askGemini(prompt);
  return parseJson(text);
};

export const generateImagePrompt = async (content: string) => {
  const prompt = `Eres director creativo especializado en marketing visual para empresas de tecnología B2B en Latinoamérica.
Crea un prompt detallado para generación de imagen de marketing basado en este contenido:
"${content}"

La imagen debe ser profesional, moderna, y adecuada para redes sociales B2B en Colombia.
Responde ÚNICAMENTE con JSON válido:
{
  "imagePrompt": "prompt detallado en inglés para generación de imagen (mínimo 50 palabras, incluye estilo, colores, composición)",
  "canvaPrompt": "descripción en español para buscar en Canva o crear manualmente",
  "style": "Photo|Illustration|Infographic|Abstract|Corporate",
  "aspectRatio": "1:1|4:5|16:9|9:16",
  "colorPalette": ["#color1", "#color2", "#color3"],
  "mood": "Profesional|Dinámico|Confiable|Innovador|Cercano"
}`;

  const text = await askGemini(prompt);
  return parseJson(text);
};
