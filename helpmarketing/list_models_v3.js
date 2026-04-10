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

// The listModels call is often not available in the simple SDK, 
// let's try to just fetch it directly via native fetch to be 100% sure
async function getModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log("NO MODELS RETURNED:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("FETCH ERROR:", e.message);
    }
}

getModels();
