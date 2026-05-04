const https = require("https");
const API_KEY = process.env.GEMINI_API_KEY;

function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
  https.get(url, (res) => {
    let raw = "";
    res.on("data", (c) => raw += c);
    res.on("end", () => {
      try {
        const data = JSON.parse(raw);
        console.log("Modelos disponibles:");
        data.models.forEach(m => console.log("- " + m.name.replace("models/", "")));
      } catch (e) {
        console.log("Error parseando:", raw.substring(0, 100));
      }
    });
  });
}

listModels();
