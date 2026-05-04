import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDhqJrnEu7nHV75D-VnE55GIkFq_IoZ0ok";
const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Di hola");
    console.log("Success:", await result.response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}

run();
