import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

// Read API key from .env manually
const envContent = fs.readFileSync('.env', 'utf8');
const apiKeyMatch = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!API_KEY) {
    console.error("API KEY NOT FOUND IN .env");
    process.exit(1);
}

async function getModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        let output = "AVAILABLE MODELS:\n";
        if (data.models) {
            data.models.forEach(m => {
                output += `- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})\n`;
            });
        } else {
            output += `NO MODELS RETURNED: ${JSON.stringify(data, null, 2)}\n`;
        }
        fs.writeFileSync('available_models_v4.txt', output, 'utf8');
        console.log("Full list saved to available_models_v4.txt");
    } catch (e) {
        console.error("FETCH ERROR:", e.message);
    }
}

getModels();
