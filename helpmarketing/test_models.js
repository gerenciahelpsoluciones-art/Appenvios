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

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Checking API Key:", API_KEY ? "PRESENT" : "MISSING");

        const models = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.0-pro-exp-02-05",
            "gemini-pro"
        ];

        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                // Using a very simple prompt
                const result = await model.generateContent("hi");
                const response = await result.response;
                console.log(`Model ${m}: SUCCESS`);
            } catch (e) {
                console.log(`Model ${m}: FAILED - ${e.message}`);
            }
        }
    } catch (error) {
        console.error("General Error:", error);
    }
}

listModels();
