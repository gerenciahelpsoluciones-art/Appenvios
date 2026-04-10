const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const API_KEY = "AIzaSyC1Yqn6cUB2H7UYVehkkeNfsHm0xISSuy4";
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  console.log("Testing Key:", API_KEY.substring(0, 8));
  
  // List models is not directly available in standard SDK easily in some versions, 
  // but let's try a direct fetch to the endpoint to see what's up.
  const fetch = require("node-fetch");
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
    console.log("Fetching models from v1 endpoint...");
    const res = await fetch(url);
    const data = await res.json();
    console.log("V1 Models Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("V1 Fetch Error:", e.message);
  }
}

test();
