const https = require("https");
const API_KEY = "AIzaSyC1Yqn6cUB2H7UYVehkkeNfsHm0xISSuy4";

const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    const list = JSON.parse(data);
    const m = list.models.find(mod => mod.name === "models/gemini-1.5-flash");
    if (m) {
      console.log("Model Info:", JSON.stringify(m, null, 2));
    } else {
      console.log("Model gemini-1.5-flash not found in list.");
    }
  });
});
