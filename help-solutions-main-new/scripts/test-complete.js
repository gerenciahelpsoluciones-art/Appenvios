const https = require("https");

const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmliZHd6aG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzczNTYsImV4cCI6MjA4NzExMzM1Nn0.sujolHHtMEsNs7EPlLYchAZRCLyMz7ek62x5eQ0h0kY";

// PASO 1: GET - Leer últimos leads
console.log("=== PASO 1: Leyendo últimos leads ===");
function doGET() {
  return new Promise((resolve) => {
    const options = {
      hostname: "matyjysinegbibdwzhoq.supabase.co",
      path: "/rest/v1/clientes_web?select=id,nombre,telefono,fuente,created_at&order=created_at.desc&limit=5",
      method: "GET",
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }
    };
    https.request(options, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => { console.log("GET Status:", res.statusCode); console.log("Leads:", d); resolve(res.statusCode); });
    }).end();
  });
}

// PASO 2: POST - Insertar un lead de prueba
function doPOST() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      nombre: "Test Completo Antigravity",
      telefono: "3009999888",
      empresa: "Test Corp",
      email: "test@completo.com",
      requerimiento: "Prueba completa automatizada",
      fuente: "Chatbot Web"
    });
    const options = {
      hostname: "matyjysinegbibdwzhoq.supabase.co",
      path: "/rest/v1/clientes_web",
      method: "POST",
      headers: {
        "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`,
        "Content-Type": "application/json", "Prefer": "return=representation",
        "Content-Length": Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => { console.log("\nPOST Status:", res.statusCode); console.log("Response:", d.substring(0, 500)); resolve(res.statusCode); });
    });
    req.write(payload);
    req.end();
  });
}

// PASO 3: Probar chat en producción
function testChat() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      messages: [{ role: "user", content: "Hola soy Maria Garcia, mi tel 3107778899, necesito mantenimiento de servidores" }]
    });
    const options = {
      hostname: "www.helpsoluciones.com.co",
      path: "/api/chat",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
    };
    const req = https.request(options, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => { console.log("\nCHAT Status:", res.statusCode); console.log("Response:", d.substring(0, 300)); resolve(res.statusCode); });
    });
    req.on("error", e => { console.error("Chat Error:", e.message); resolve(0); });
    req.write(payload);
    req.end();
  });
}

async function main() {
  await doGET();
  console.log("\n=== PASO 2: Insertando lead directo ===");
  const postResult = await doPOST();
  if (postResult === 201) console.log("✅ INSERT DIRECTO: EXITOSO");
  else console.log("❌ INSERT DIRECTO: FALLÓ");

  console.log("\n=== PASO 3: Probando chat en producción ===");
  await testChat();

  console.log("\n=== PASO 4: Verificando leads después de prueba ===");
  await new Promise(r => setTimeout(r, 3000));
  await doGET();
}

main();
