const https = require("https");
const API_KEY = "AIzaSyC1Yqn6cUB2H7UYVehkkeNfsHm0xISSuy4";

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => { data += chunk; });
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Body truncated:", data.substring(0, 500));
  });
});
