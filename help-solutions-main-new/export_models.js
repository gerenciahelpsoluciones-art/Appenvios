const https = require("https");
const fs = require("fs");
const API_KEY = "AIzaSyC1Yqn6cUB2H7UYVehkkeNfsHm0xISSuy4";

const url = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    fs.writeFileSync("api_models_full.json", data);
    console.log("Written api_models_full.json");
  });
});
