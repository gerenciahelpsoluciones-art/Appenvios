const { GoogleGenerativeAI } = require("@google/generative-ai");

const KEY = process.env.GEMINI_API_KEY;
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
