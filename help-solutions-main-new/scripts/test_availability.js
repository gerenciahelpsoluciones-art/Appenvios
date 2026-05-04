const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ No GEMINI_API_KEY found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    
    // Test models
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
    
    for (const modelName of models) {
        try {
            console.log(`\nTesting model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hola, ¿quién eres?");
            console.log(`✅ Success with ${modelName}:`, result.response.text());
        } catch (error) {
            console.error(`❌ Failed with ${modelName}:`, error.message);
        }
    }
}

test();
