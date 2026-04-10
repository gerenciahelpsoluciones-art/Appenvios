const https = require("https");

const API_KEY = "AIzaSyC1Yqn6cUB2H7UYVehkkeNfsHm0xISSuy4";

function getModels() {
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;
  
  https.get(url, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      console.log("Response Status:", res.statusCode);
      console.log("Body:", data);
    });
  }).on("error", (err) => {
    console.error("Error:", err.message);
  });
}

getModels();
