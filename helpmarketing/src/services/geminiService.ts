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

  const prompt = `Eres un experto en SEO técnico, posicionamiento local y marketing digital para empresas B2B colombianas.
Analiza exhaustivamente el sitio web: ${url}
${pagespeedData ? `Datos reales de PageSpeed API: LCP=${lcp}, Performance Score=${score}/100` : "Sin datos de PageSpeed (analiza basado en tu conocimiento del sitio)."}

Genera un informe SEO completo y profesional. Responde ÚNICAMENTE con JSON válido sin texto adicional:
{
  "score": ${score || 62},
  "grade": "letra de A a F según el score",
  "loadTime": "${lcp !== "N/A" ? lcp : "estimado 2.8s"}",
  "metaTagsScore": número entero 0-100,
  "summary": "párrafo de 2-3 oraciones con diagnóstico ejecutivo del estado SEO actual del sitio",
  "categoryScores": {
    "tecnico": número 0-100,
    "contenido": número 0-100,
    "local": número 0-100,
    "autoridad": número 0-100,
    "experiencia": número 0-100
  },
  "onPage": [
    {"item": "Title Tag", "status": "ok|warning|error", "detail": "evaluación específica del title tag"},
    {"item": "Meta Description", "status": "ok|warning|error", "detail": "evaluación de la meta descripción"},
    {"item": "Estructura H1/H2/H3", "status": "ok|warning|error", "detail": "uso correcto de headings"},
    {"item": "Imágenes con Alt Text", "status": "ok|warning|error", "detail": "optimización de imágenes"},
    {"item": "HTTPS y Seguridad", "status": "ok|warning|error", "detail": "certificado SSL y seguridad"},
    {"item": "Responsive / Mobile", "status": "ok|warning|error", "detail": "adaptación a dispositivos móviles"},
    {"item": "Schema Markup", "status": "ok|warning|error", "detail": "datos estructurados JSON-LD"},
    {"item": "Velocidad de Carga", "status": "ok|warning|error", "detail": "Core Web Vitals y performance"},
    {"item": "URLs Amigables", "status": "ok|warning|error", "detail": "estructura de URLs para SEO"},
    {"item": "Sitemap y Robots.txt", "status": "ok|warning|error", "detail": "indexación y rastreo"}
  ],
  "recommendations": [
    {"priority": "Alta", "issue": "problema crítico 1", "fix": "solución detallada y accionable", "impact": "impacto estimado en tráfico o posicionamiento"},
    {"priority": "Alta", "issue": "problema crítico 2", "fix": "solución detallada", "impact": "..."},
    {"priority": "Alta", "issue": "problema crítico 3", "fix": "solución detallada", "impact": "..."},
    {"priority": "Media", "issue": "mejora importante 1", "fix": "cómo implementarlo", "impact": "..."},
    {"priority": "Media", "issue": "mejora importante 2", "fix": "cómo implementarlo", "impact": "..."},
    {"priority": "Media", "issue": "mejora importante 3", "fix": "cómo implementarlo", "impact": "..."},
    {"priority": "Baja", "issue": "mejora secundaria 1", "fix": "cómo implementarlo", "impact": "..."},
    {"priority": "Baja", "issue": "mejora secundaria 2", "fix": "cómo implementarlo", "impact": "..."}
  ],
  "keywords": [
    {"term": "keyword principal 1", "intent": "comercial|informacional|navegacional", "difficulty": "Alta|Media|Baja", "opportunity": "Alta|Media|Baja"},
    {"term": "keyword 2", "intent": "...", "difficulty": "...", "opportunity": "..."},
    {"term": "keyword 3", "intent": "...", "difficulty": "...", "opportunity": "..."},
    {"term": "keyword 4", "intent": "...", "difficulty": "...", "opportunity": "..."},
    {"term": "keyword 5", "intent": "...", "difficulty": "...", "opportunity": "..."},
    {"term": "keyword 6", "intent": "...", "difficulty": "...", "opportunity": "..."},
    {"term": "keyword 7", "intent": "...", "difficulty": "...", "opportunity": "..."},
    {"term": "keyword 8", "intent": "...", "difficulty": "...", "opportunity": "..."}
  ],
  "competitors": [
    {"name": "competidor real 1", "domain": "dominio.com", "fortaleza": "en qué le gana a nuestro sitio", "debilidad": "en qué podemos superarlo"},
    {"name": "competidor real 2", "domain": "dominio.com", "fortaleza": "...", "debilidad": "..."},
    {"name": "competidor real 3", "domain": "dominio.com", "fortaleza": "...", "debilidad": "..."}
  ],
  "contentGaps": [
    {"topic": "tema de contenido 1 con alta demanda", "keyword": "keyword objetivo", "type": "Blog|Página de servicio|Landing"},
    {"topic": "tema 2", "keyword": "...", "type": "..."},
    {"topic": "tema 3", "keyword": "...", "type": "..."},
    {"topic": "tema 4", "keyword": "...", "type": "..."},
    {"topic": "tema 5", "keyword": "...", "type": "..."}
  ],
  "localSeo": {
    "score": número 0-100,
    "items": [
      {"item": "Google Business Profile", "status": "ok|warning|error", "detail": "evaluación"},
      {"item": "NAP Consistente (Nombre, Dirección, Teléfono)", "status": "ok|warning|error", "detail": "evaluación"},
      {"item": "Keywords con ubicación (Bogotá)", "status": "ok|warning|error", "detail": "evaluación"},
      {"item": "Reseñas y Rating", "status": "ok|warning|error", "detail": "evaluación"},
      {"item": "Citas en directorios locales", "status": "ok|warning|error", "detail": "evaluación"}
    ]
  },
  "technicalIssues": ["issue técnico específico 1", "issue técnico 2", "issue técnico 3", "issue técnico 4"]
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

export const huntNearbyLeads = async (zona: string, sector: string, radio: string) => {
  const prompt = `Eres especialista en prospección comercial puerta a puerta para empresas de tecnología en Colombia.

Help Soluciones Informáticas está ubicada en Cl. 6c #82a 91, Bogotá (zona ${zona}).
Necesita encontrar PYMEs cercanas que NO tengan página web o tengan presencia digital muy precaria.

Genera 8 prospectos realistas de negocios físicos en la zona ${zona} de Bogotá (radio ${radio}) en el sector "${sector}" que:
- No tienen sitio web o solo tienen Facebook desactualizado
- Tienen potencial de compra de servicios TI (mínimo 5 empleados)
- Son visitables presencialmente

Para cada prospecto incluye cómo encontrarlo físicamente y un script de acercamiento.

Responde ÚNICAMENTE con array JSON válido:
[
  {
    "company": "nombre realista del negocio",
    "type": "tipo de negocio (ej: Clínica veterinaria, Distribuidora, Taller mecánico)",
    "sector": "${sector}",
    "zone": "barrio o sector específico en ${zona}, Bogotá",
    "address": "dirección aproximada o referencia (ej: Cerca al centro comercial Titan Plaza, Av. El Dorado)",
    "employees": "rango estimado de empleados (ej: 5-15)",
    "webPresence": "Sin web|Solo Facebook|Web desactualizada|Sin redes",
    "painPoint": "problema tecnológico específico que probablemente tiene (computadores lentos, no tienen facturación electrónica, no tienen red interna, etc.)",
    "opportunity": "servicio específico de Help Soluciones que le vendería primero",
    "estimatedBudget": "presupuesto estimado mensual en COP",
    "howToFind": "cómo llegar o identificar el negocio físicamente (Google Maps, recorrer la calle X, llamar al directorio de la cámara de comercio, etc.)",
    "approachScript": "guión de 2-3 oraciones para el primer contacto presencial o telefónico, tono natural y colombiano",
    "priority": "Alta|Media|Baja"
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
