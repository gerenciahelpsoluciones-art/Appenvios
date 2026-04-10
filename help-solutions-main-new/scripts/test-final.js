const { GoogleGenerativeAI } = require("@google/generative-ai");

const KEY = "AIzaSyBwt6bAiIHn01JKj-l8Uq6Vj9xPpwIvuUw";
const genAI = new GoogleGenerativeAI(KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hola, responde con 'FUNCIONA'");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}

test();
