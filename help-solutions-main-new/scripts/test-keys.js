const https = require("https");

const SB_URL = "https://matyjysinegbibdwzhoq.supabase.co";

// Clave NUEVA encontrada en .env.vercel y .env.local
const SB_KEY_NEW = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmliZHd6aG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzczNTYsImV4cCI6MjA4NzExMzM1Nn0.sujolHHtMEsNs7EPlLYchAZRCLyMz7ek62x5eQ0h0kY";

// Clave VIEJA que estábamos usando
const SB_KEY_OLD = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmlid3pob3EiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODIxNjEwMiwiZXhwIjoyMDUzNzkyMTAyfQ.UvshWST_v9G14u6fW5G1YtO_p5m728yY_u_vi_6890";

async function testKey(name, key) {
  console.log(`\n=== Probando clave ${name} ===`);
  
  const payload = JSON.stringify({
    nombre: `Test ${name}`,
    telefono: "1234567890",
    requerimiento: "Prueba de clave",
    fuente: "Chatbot Web"
  });

  return new Promise((resolve) => {
    const url = new URL(`${SB_URL}/rest/v1/clientes_web`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        console.log(`Status: ${res.statusCode}`);
        if (data) console.log(`Response: ${data.substring(0, 200)}`);
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log(`✅ Clave ${name}: FUNCIONA`);
        } else {
          console.log(`❌ Clave ${name}: FALLÓ (${res.statusCode})`);
        }
        resolve(res.statusCode);
      });
    });
    req.on("error", (err) => { console.error("Error:", err.message); resolve(0); });
    req.write(payload);
    req.end();
  });
}

async function main() {
  await testKey("NUEVA (.env.vercel)", SB_KEY_NEW);
  await testKey("VIEJA (check_supabase)", SB_KEY_OLD);
}

main();
