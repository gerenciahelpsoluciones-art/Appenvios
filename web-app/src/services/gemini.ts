import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY no está configurada en el archivo .env");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

/**
 * Genera una respuesta de texto utilizando el modelo Gemini.
 * @param prompt El texto de entrada para el modelo.
 * @param modelName El nombre del modelo a utilizar (por defecto gemini-1.5-flash).
 * @returns La respuesta generada por el modelo.
 */
export async function generateContent(prompt: string, modelName: string = "gemini-1.5-flash") {
  if (!API_KEY) {
    throw new Error("La API Key de Gemini no está configurada.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error al generar contenido con Gemini:", error);
    throw error;
  }
}

/**
 * Inicia una sesión de chat con Gemini.
 * @param history Historial opcional de la conversación.
 * @returns Un objeto ChatSession.
 */
export function startChat(history: any[] = []) {
  if (!API_KEY) {
    throw new Error("La API Key de Gemini no está configurada.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  return model.startChat({
    history: history,
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });
}
