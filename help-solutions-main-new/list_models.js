const https = require("https");
const API_KEY = "AIzaSyC1Yqn6cUB2H7UYVehkkeNfsHm0xISSuy4";

const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    const list = JSON.parse(data);
    const names = list.models.map(m => m.name);
    console.log("AVAILABLE_MODELS:", JSON.stringify(names));
  });
});
