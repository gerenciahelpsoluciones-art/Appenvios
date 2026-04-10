const https = require("https");

// CLAVES A PROBAR
const SB_URL = "https://matyjysinegbibdwzhoq.supabase.co";
const KEYS = {
  "NUEVA (.env.vercel)": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmliZHd6aG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzczNTYsImV4cCI6MjA4NzExMzM1Nn0.sujolHHtMEsNs7EPlLYchAZRCLyMz7ek62x5eQ0h0kY",
  "VIEJA (check_supabase)": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmlid3pob3EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODIxNjEwMiwiZXhwIjoyMDUzNzkyMTAyfQ.UvshWST_v9G14u6fW5G1YtO_p5m728yY_u_vi_6890"
};

// Decodificar JWT para ver ref
function decodeJWT(token) {
  const parts = token.split(".");
  const payload = Buffer.from(parts[1], "base64").toString("utf8");
  return JSON.parse(payload);
}

// Test GET (solo lectura, no necesita permisos de escritura)
function testGET(name, key) {
  return new Promise((resolve) => {
    const path = "/rest/v1/clientes_web?select=nombre,telefono&limit=3";
    const options = {
      hostname: "matyjysinegbibdwzhoq.supabase.co",
      path: path,
      method: "GET",
      headers: { "apikey": key, "Authorization": `Bearer ${key}` }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        console.log(`  GET Status: ${res.statusCode}`);
        console.log(`  Response: ${data.substring(0, 200)}`);
        resolve(res.statusCode);
      });
    });
    req.on("error", (e) => { console.error("  Error:", e.message); resolve(0); });
    req.end();
  });
}

// Test POST (escritura)
function testPOST(name, key) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      nombre: `TestKey-${name.substring(0,5)}`,
      telefono: "5551234567",
      requerimiento: "Test automático",
      fuente: "Chatbot Web"
    });
    const options = {
      hostname: "matyjysinegbibdwzhoq.supabase.co",
      path: "/rest/v1/clientes_web",
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
        "Content-Length": Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        console.log(`  POST Status: ${res.statusCode}`);
        if (data) console.log(`  Response: ${data.substring(0, 200)}`);
        resolve(res.statusCode);
      });
    });
    req.on("error", (e) => { console.error("  Error:", e.message); resolve(0); });
    req.write(payload);
    req.end();
  });
}

async function main() {
  for (const [name, key] of Object.entries(KEYS)) {
    console.log(`\n=== ${name} ===`);
    const decoded = decodeJWT(key);
    console.log(`  JWT ref: ${decoded.ref}`);
    console.log(`  JWT exp: ${new Date(decoded.exp * 1000).toISOString()}`);
    console.log(`  JWT iat: ${new Date(decoded.iat * 1000).toISOString()}`);
    
    const getStatus = await testGET(name, key);
    if (getStatus === 200) {
      console.log(`  ✅ GET funciona, probando POST...`);
      const postStatus = await testPOST(name, key);
      if (postStatus === 201 || postStatus === 200) {
        console.log(`  ✅✅ POST FUNCIONA - Esta es la clave correcta!`);
      } else {
        console.log(`  ❌ POST falló con ${postStatus}`);
      }
    } else {
      console.log(`  ❌ GET falló - clave inválida`);
    }
  }
}

main();
