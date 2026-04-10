
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function checkQuota() {
    const API_KEY = "AIzaSyDhqJrnEu7nHV75D-VnE55GIkFq_IoZ0ok";
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log("--- Iniciando diagnóstico de cuota Gemini ---");
    console.log("Probando con modelo: gemini-2.0-flash");
    
    try {
        const result = await model.generateContent("Hola, responde con la palabra 'OK' si recibes este mensaje.");
        const response = await result.response;
        console.log("Respuesta recibida:", response.text());
        console.log("ESTADO: CUOTA DISPONIBLE ✅");
    } catch (error) {
        if (error.message.includes("429")) {
            console.log("ESTADO: CUOTA EXCEDIDA (429 Too Many Requests) ❌");
            console.log("Detalle: Se ha superado el límite de solicitudes por minuto o día de la versión gratuita.");
        } else if (error.message.includes("403")) {
            console.log("ESTADO: ACCESO DENEGADO (403 Forbidden) ❌");
            console.log("Detalle: API Key inválida o sin permisos.");
        } else {
            console.log("ERROR INESPERADO:", error.message);
        }
    }
    console.log("--- Fin del diagnóstico ---");
}

checkQuota();
