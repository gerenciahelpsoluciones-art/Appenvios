const https = require("https");
const API_KEY = "AIzaSyC1Yqn6cUB2H7UYVehkkeNfsHm0xISSuy4";

const data = JSON.stringify({
  contents: [{ parts: [{ text: "Hola" }] }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Body:", body);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
