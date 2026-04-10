import { GoogleGenerativeAI } from "@google/generative-ai";
import { SENIOR_REPORTING_PROMPT } from './prompts';

const getGenAI = () => {
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '';
  return new GoogleGenerativeAI(apiKey);
};

const MODELS_TO_TRY = ["gemini-1.5-pro", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-flash"];

export const analyzeContract = async (text: string) => {
  const genAI = getGenAI();
  let error: any;
  
  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = `Extrae las obligaciones del siguiente contrato y devuélvelas en formato JSON:\n\n${text}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.error(`⚠️ Fallo con modelo ${modelName} en analyzeContract:`, err);
      error = err;
    }
  }
  throw error || new Error("Todos los modelos fallaron en analyzeContract");
};

export const synthesizeReport = async (obligations: any[], activities: any[], images: string[] = []) => {
  const genAI = getGenAI();
  let error: any;

  const context = `
    Tema del informe: Análisis de Ejecución Contractual
    Contrato Principal: ${JSON.stringify(obligations)}
    Actividades Realizadas: ${JSON.stringify(activities)}
    Imágenes de Evidencia (URLs): ${images.join(', ')}
  `;

  const finalPrompt = `${SENIOR_REPORTING_PROMPT}\n\n${context}`;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.error(`⚠️ Fallo con modelo ${modelName} en synthesizeReport:`, err);
      error = err;
    }
  }
  throw error || new Error("Todos los modelos fallaron en synthesizeReport");
};

