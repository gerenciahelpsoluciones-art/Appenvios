// Test completo: Chatbot + Supabase
const https = require("https");
const http = require("http");

const SB_URL = "https://matyjysinegbibdwzhoq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmlid3pob3EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODIxNjEwMiwiZXhwIjoyMDUzNzkyMTAyfQ.UvshWST_v9G14u6fW5G1YtO_p5m728yY_u_vi_6890";

// PASO 1: Insertar un lead directamente en Supabase
async function testSupabaseInsert() {
  console.log("=== PASO 1: Insertando lead directamente en Supabase ===");
  
  const payload = JSON.stringify({
    nombre: "Test Antigravity v2",
    telefono: "9998887777",
    empresa: "Test Corp",
    email: "test@antigravity.com",
    requerimiento: "Prueba directa desde script",
    fuente: "Chatbot Web"
  });

  return new Promise((resolve, reject) => {
    const url = new URL(`${SB_URL}/rest/v1/clientes_web`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        console.log("Status:", res.statusCode);
        console.log("Response:", data.substring(0, 300));
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log("✅ INSERT EN SUPABASE: EXITOSO");
          resolve(true);
        } else {
          console.log("❌ INSERT EN SUPABASE: FALLÓ");
          resolve(false);
        }
      });
    });
    req.on("error", (err) => {
      console.error("Error de red:", err.message);
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

// PASO 2: Leer los últimos leads de Supabase
async function testSupabaseRead() {
  console.log("\n=== PASO 2: Leyendo últimos leads de Supabase ===");
  
  return new Promise((resolve) => {
    const url = new URL(`${SB_URL}/rest/v1/clientes_web?select=nombre,telefono,fuente,created_at&order=created_at.desc&limit=5`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        console.log("Status:", res.statusCode);
        try {
          const leads = JSON.parse(data);
          console.log("Últimos", leads.length, "leads:");
          leads.forEach(l => console.log(`  - ${l.nombre} | ${l.telefono} | ${l.fuente} | ${l.created_at}`));
        } catch (e) {
          console.log("Raw:", data.substring(0, 200));
        }
        resolve();
      });
    });
    req.on("error", (err) => console.error("Error:", err.message));
    req.end();
  });
}

// PASO 3: Probar el endpoint de chat en producción
async function testChatEndpoint() {
  console.log("\n=== PASO 3: Probando /api/chat en producción ===");
  
  const payload = JSON.stringify({
    messages: [
      { role: "user", content: "Hola, soy Carlos Prueba, teléfono 3001112222, necesito soporte con un servidor" }
    ]
  });

  return new Promise((resolve) => {
    const url = new URL("https://www.helpsoluciones.com.co/api/chat");
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        console.log("Status:", res.statusCode);
        console.log("Response:", data.substring(0, 300));
        if (res.statusCode === 200) {
          console.log("✅ CHAT ENDPOINT: FUNCIONA");
        } else {
          console.log("❌ CHAT ENDPOINT: FALLÓ");
        }
        resolve();
      });
    });
    req.on("error", (err) => {
      console.error("Error de red:", err.message);
      resolve();
    });
    req.write(payload);
    req.end();
  });
}

async function main() {
  await testSupabaseInsert();
  await testSupabaseRead();
  await testChatEndpoint();
  
  // Esperar un poco y volver a leer para ver si el chat guardó el lead
  console.log("\n=== Esperando 5s para verificar si el chat guardó el lead... ===");
  await new Promise(r => setTimeout(r, 5000));
  await testSupabaseRead();
}

main();
