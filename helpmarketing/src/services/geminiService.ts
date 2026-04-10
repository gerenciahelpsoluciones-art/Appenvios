import Anthropic from "@anthropic-ai/sdk";

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
if (!API_KEY || API_KEY === "YOUR_ANTHROPIC_API_KEY") {
  console.error("ANTHROPIC API KEY FALTANTE EN .env — configura VITE_ANTHROPIC_API_KEY");
}

const client = new Anthropic({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = "claude-opus-4-6";

const askClaude = async (prompt: string): Promise<string> => {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  // Extraer el bloque de texto de la respuesta
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude no devolvió bloque de texto");
  }
  return textBlock.text;
};

export const generateMarketingContent = async (prompt: string, platform: string) => {
  try {
    const isWhatsApp = platform === 'WhatsApp';

    const fullPrompt = isWhatsApp ? `
      Eres un experto en comunicación empresarial B2B para "Help Soluciones" (empresa TI en Colombia).
      Crea un mensaje profesional para enviar por WhatsApp Business a clientes o prospectos.

      Contexto: Especialistas en Servidores, Redes, Ciberseguridad y Soporte Técnico. 10+ años de experiencia.

      Solicitud: ${prompt}

      REGLAS PARA WHATSAPP:
      - Tono cercano pero profesional, como un asesor de confianza
      - Párrafos cortos (máximo 3 líneas cada uno)
      - Usa emojis con moderación (máximo 5 en todo el mensaje)
      - Incluye un llamado a la acción claro al final (WhatsApp, llamada o reunión)
      - SIN hashtags (no funcionan en WhatsApp)
      - Formato: usa *negrita* para resaltar términos clave
      - Longitud ideal: 80-150 palabras

      Responde ÚNICAMENTE con un JSON válido, sin texto adicional:
      {
        "title": "Asunto o tema del mensaje (interno, no se envía)",
        "copy": "El mensaje completo listo para copiar y enviar por WhatsApp",
        "hashtags": []
      }
    ` : `
      Eres un experto en Marketing Digital para una empresa de tecnología en Colombia llamada "Help Soluciones".
      Tu objetivo es crear contenido de alta calidad para ${platform}.

      Contexto de la empresa:
      - Especialistas en Mantenimiento de Servidores, Redes de comunicación (cableado estructurado), Ciberseguridad, Networking y Soporte Técnico.
      - 10+ años de experiencia.
      - Tono: Profesional, experto, confiable pero moderno y cercano.

      Solicitud del usuario: ${prompt}

      Responde ÚNICAMENTE con un JSON válido, sin texto adicional, con la siguiente estructura:
      {
        "title": "Un título llamativo (máximo 10 palabras)",
        "copy": "El contenido principal del post con emojis estratégicos",
        "hashtags": ["lista", "de", "hashtags", "relevantes"]
      }
    `;

    const text = await askClaude(fullPrompt);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("JSON no encontrado en la respuesta");
    return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  } catch (error) {
    console.error("Claude API Error (generateMarketingContent):", error);
    throw error;
  }
};

export const analyzeCompetitor = async (competitorName: string, website: string) => {
  try {
    const fullPrompt = `
      Eres un analista de Inteligencia de Mercados experto en el sector TI de Colombia.
      Analiza al siguiente competidor para la empresa "Help Soluciones":
      Nombre: ${competitorName}
      Sitio Web: ${website}

      Basándote en tu conocimiento, proporciona un análisis estratégico comparativo.

      Responde ÚNICAMENTE con un JSON válido, sin texto adicional:
      {
        "strengths": ["fortaleza 1", "fortaleza 2"],
        "weaknesses": ["debilidad 1", "debilidad 2"],
        "differentiator": "Qué hace a Help Soluciones mejor o diferente frente a ellos en una frase",
        "threatLevel": "Bajo | Medio | Alto",
        "marketStrategy": "Breve descripción de su enfoque (ej: Soporte masivo, Consultoría especializada, etc)"
      }
    `;

    const text = await askClaude(fullPrompt);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Format error");
    return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  } catch (error) {
    console.error("Competitor Analysis Error:", error);
    return {
      strengths: ["Soporte técnico estructurado", "Presencia local"],
      weaknesses: ["Tiempos de respuesta", "Escalabilidad limitada"],
      differentiator: "Análisis no disponible en este momento",
      threatLevel: "Medio",
      marketStrategy: "Mantenimiento preventivo estándar",
    };
  }
};

export const optimizeGoogleBusiness = async (currentInfo: string) => {
  try {
    const fullPrompt = `
      Eres un experto en SEO Local y Google Business Profile (GMB).
      Ayuda a "Help Soluciones" (Infraestructura TI, Servidores, Redes en Bogotá) a optimizar su perfil.

      Información actual: ${currentInfo}

      Proporciona:
      1. Sugerencia de palabras clave locales.
      2. Una nueva descripción optimizada.
      3. Una idea de publicación (Google Post) para esta semana.

      Responde ÚNICAMENTE con un JSON válido, sin texto adicional:
      {
        "keywords": ["palabra 1", "palabra 2"],
        "description": "Nueva descripción optimizada para SEO local",
        "postIdea": {
          "title": "Título del post",
          "content": "Contenido del post con llamado a la acción"
        }
      }
    `;

    const text = await askClaude(fullPrompt);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Format error");
    return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  } catch (error) {
    console.error("GMB Optimization Error:", error);
    return {
      keywords: ["Soporte técnico Bogotá", "Mantenimiento servidores Colombia"],
      description: "Expertos en infraestructura TI con más de 10 años de experiencia.",
      postIdea: { title: "Mantenimiento Preventivo", content: "Asegura la continuidad de tu negocio." },
    };
  }
};

export const analyzeRentalService = async (equipmentType: string, quantity: number, durationMonths: number) => {
  try {
    const fullPrompt = `
      Eres un consultor de negocios TI. Analiza un posible servicio de renta para "Help Soluciones".
      Equipo: ${equipmentType}
      Cantidad: ${quantity}
      Duración: ${durationMonths} meses

      Basado en el mercado de Bogotá (donde una laptop básica se renta entre $100k-$150k COP), proporciona:
      1. Precio sugerido por unidad/mes.
      2. Margen estimado vs competencia.
      3. 3 beneficios clave para venderle este servicio a un cliente corporativo.

      Responde ÚNICAMENTE con un JSON válido, sin texto adicional:
      {
        "suggestedPrice": "$1XXXXX COP",
        "marketVibe": "Competitivo | Premium | Económico",
        "sellingPoints": ["punto 1", "punto 2", "punto 3"],
        "strategy": "Cómo empaquetar este servicio (ej: Incluir soporte en sitio)"
      }
    `;

    const text = await askClaude(fullPrompt);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Format error");
    return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  } catch (error) {
    console.error("Rental Analysis Error:", error);
    return {
      suggestedPrice: "$120,000 COP",
      marketVibe: "Competitivo",
      sellingPoints: ["Equipos actualizados", "Soporte técnico incluido", "Deducción de impuestos"],
      strategy: "Ofrecer contrato de 12 meses con preventivo trimestral.",
    };
  }
};

export const sendToN8n = async (postData: any) => {
  const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

  if (!N8N_WEBHOOK_URL) {
    console.warn("n8n Webhook URL no configurado.");
    return { success: false, message: "Webhook URL missing" };
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    if (!response.ok) throw new Error("n8n response not ok");
    return { success: true };
  } catch (error) {
    console.error("n8n Integration Error:", error);
    throw error;
  }
};

export const getTrendingAdvice = async () => {
  try {
    const fullPrompt = `
      Eres un estratega de contenido senior en Colombia para el sector TI (Help Soluciones).
      Basado en las tendencias de 2024-2025:
      - Ciberseguridad (Colombia es 4to país más atacado en Latam).
      - Renta de equipos (cambio de CAPEX a OPEX).
      - IA Generativa como herramienta de productividad corporativa.
      - SEO Local y Google Business.

      Genera 3 ideas de publicaciones altamente eficaces y estratégicas.
      Para cada idea, incluye:
      1. El "Gancho" inicial.
      2. El valor estratégico (Por qué funciona ahora).
      3. Recomendación de Red Social.

      Responde ÚNICAMENTE con un JSON array válido, sin texto adicional:
      [
        {
          "topic": "Título sugerido",
          "hook": "Frase de enganche",
          "whyNow": "Justificación de tendencia",
          "platform": "LinkedIn | Instagram | etc",
          "callToAction": "Sugerencia de cierre"
        }
      ]
    `;

    const text = await askClaude(fullPrompt);
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket === -1 || lastBracket === -1) throw new Error("Format error");
    return JSON.parse(text.substring(firstBracket, lastBracket + 1));
  } catch (error) {
    console.error("Trend Analysis Error:", error);
    return [
      {
        topic: "Ciberseguridad en Colombia",
        hook: "¿Sabías que Colombia es el 4to país más atacado de Latam?",
        whyNow: "La alta incidencia de ataques de ransomware en 2024.",
        platform: "LinkedIn",
        callToAction: "Solicitar auditoría gratuita.",
      },
    ];
  }
};

export const analyzeSeo = async (url: string) => {
  try {
    const fullPrompt = `
      Eres un experto en SEO técnico y rendimiento web.
      Realiza una auditoría simulada pero realista del sitio web: ${url}

      Debes evaluar:
      1. Puntuación SEO general (0-100).
      2. Tiempo de carga estimado.
      3. Calidad de Meta Tags (0-10).
      4. 3 Recomendaciones críticas (alt tags, jerarquía de encabezados, meta descripciones, etc).

      Responde ÚNICAMENTE con un JSON válido, sin texto adicional:
      {
        "score": 85,
        "loadTime": "1.2s",
        "metaTagsScore": 8,
        "recommendations": [
          { "title": "Alt Tags", "desc": "Descripción del problema...", "severity": "high" },
          { "title": "Headers", "desc": "Descripción...", "severity": "medium" },
          { "title": "Meta", "desc": "Descripción...", "severity": "low" }
        ]
      }
    `;

    const text = await askClaude(fullPrompt);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Format error");
    return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  } catch (error) {
    console.error("SEO Analysis Error:", error);
    return {
      score: 70,
      loadTime: "2.5s",
      metaTagsScore: 6,
      recommendations: [
        { title: "Error de Conexión", desc: "No se pudo realizar el análisis en vivo.", severity: "high" },
      ],
    };
  }
};

export const huntLeads = async (sector: string, location: string) => {
  try {
    const fullPrompt = `
      Eres un agente inteligente de prospección B2B.
      Busca 3 leads (empresas reales o tipos de empresas) con alta probabilidad de necesitar servicios de Infraestructura TI, Servidores o Ciberseguridad en:
      Sector/Nicho: ${sector}
      Ubicación: ${location}

      Responde ÚNICAMENTE con un JSON array válido, sin texto adicional:
      [
        {
          "company": "Nombre de la Empresa",
          "reason": "Por qué es un buen lead hoy (noticias recientes, expansión, etc)",
          "confidence": "95%"
        }
      ]
    `;

    const text = await askClaude(fullPrompt);
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket === -1 || lastBracket === -1) throw new Error("Format error");
    return JSON.parse(text.substring(firstBracket, lastBracket + 1));
  } catch (error) {
    console.error("Lead Hunting Error:", error);
    return [
      { company: "Empresa de Logística A", reason: "Expansión regional detectada.", confidence: "80%" },
      { company: "Financiera B", reason: "Necesidad de refuerzo en ciberseguridad.", confidence: "75%" },
    ];
  }
};

export const suggestReply = async (comment: string, platform: string) => {
  try {
    const fullPrompt = `
      Eres el Community Manager de "Help Soluciones" (empresa líder en TI, servidores y redes en Colombia).
      Tu objetivo es responder de forma profesional, amable y resolutiva a un comentario en ${platform}.

      Comentario del usuario: "${comment}"

      Tono de Help Soluciones: Experto, confiable, pero muy servicial y moderno.

      Responde ÚNICAMENTE con un JSON válido, sin texto adicional:
      {
        "reply": "Tu respuesta sugerida aquí",
        "sentiment": "Positivo | Pregunta | Reclamo",
        "actionNeeded": "No | Sí (contactar ventas) | Sí (soporte técnico)"
      }
    `;

    const text = await askClaude(fullPrompt);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Format error");
    return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  } catch (error) {
    console.error("Reply Suggestion Error:", error);
    return {
      reply: "¡Hola! Gracias por escribirnos. Pronto un asesor te contactará.",
      sentiment: "Positivo",
      actionNeeded: "Sí",
    };
  }
};

export const generateImagePrompt = async (postCopy: string, platform: string) => {
  try {
    const fullPrompt = `
      Eres un director creativo experto en fotografía corporativa y diseño gráfico para redes sociales.
      Genera prompts de imagen para el post de ${platform} de "Help Soluciones" (empresa TI en Colombia).

      POST: "${postCopy}"

      Estilo visual de Help Soluciones:
      - Colores: Azul profundo (#0f172a), Cyan (#06b6d4), Blanco puro, toques de Esmeralda (#10b981)
      - Estilo: Fotografía corporativa de alta gama, 3D Render sofisticado o Composición Digital Minimalista
      - Sin texto dentro de la imagen
      - Si el post habla de ciberseguridad: escudos digitales, código, candados holográficos
      - Si habla de servidores/redes: racks modernos, fibra óptica, data center iluminado
      - Si habla de IA/bots: robot amigable holográfico, partículas de datos
      - Si habla de equipo/personas: profesionales en entorno tecnológico moderno

      Genera DOS versiones:
      1. "imagePrompt": prompt DETALLADO en inglés para Midjourney/DALL-E (mínimo 60 palabras, con lighting, composition, style)
      2. "canvaPrompt": prompt CORTO en español para Canva AI (máximo 25 palabras, directo y visual)

      Responde ÚNICAMENTE con un JSON válido, sin texto adicional:
      {
        "imagePrompt": "Detailed English prompt for Midjourney...",
        "canvaPrompt": "Prompt corto en español para Canva...",
        "style": "Photo | 3D Render | Minimalist",
        "aspectRatio": "1:1"
      }
    `;

    const text = await askClaude(fullPrompt);
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("Format error");
    return JSON.parse(text.substring(firstBrace, lastBrace + 1));
  } catch (error) {
    console.error("Image Prompt Gen Error:", error);
    return {
      imagePrompt:
        "Modern high-tech data center with clean blue lighting, professional photography, corporate technology background.",
      canvaPrompt:
        "Centro de datos moderno con iluminación azul cyan, estilo corporativo tecnológico profesional",
      style: "Photo",
      aspectRatio: "1:1",
    };
  }
};
