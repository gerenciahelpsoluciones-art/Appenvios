const { GoogleGenerativeAI } = require("@google/generative-ai");

const KEY = "AIzaSyBwt6bAiIHn01JKj-l8Uq6Vj9xPpwIvuUw";
const genAI = new GoogleGenerativeAI(KEY);

async function test() {
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash"];
  for (const m of models) {
    try {
      console.log(`--- Probando ${m} ---`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hola");
      console.log(`✅ ${m} FUNCIONA:`, result.response.text().substring(0, 20));
      return m;
    } catch (err) {
      console.log(`❌ ${m} FALLÓ:`, err.message.substring(0, 100));
    }
  }
}

test();
