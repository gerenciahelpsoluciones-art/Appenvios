const https = require("https");

const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmliZHd6aG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzczNTYsImV4cCI6MjA4NzExMzM1Nn0.sujolHHtMEsNs7EPlLYchAZRCLyMz7ek62x5eQ0h0kY";

// Primero: ver qué columnas tiene la tabla
function getColumns() {
  return new Promise((resolve) => {
    const options = {
      hostname: "matyjysinegbibdwzhoq.supabase.co",
      path: "/rest/v1/clientes_web?select=*&limit=1",
      method: "GET",
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }
    };
    https.request(options, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => {
        console.log("GET Status:", res.statusCode);
        try {
          const rows = JSON.parse(d);
          if (rows.length > 0) {
            console.log("Columnas:", Object.keys(rows[0]).join(", "));
            console.log("Ejemplo:", JSON.stringify(rows[0], null, 2));
          } else {
            console.log("Tabla vacía, probando con HEAD...");
          }
        } catch(e) {
          console.log("Raw:", d.substring(0, 500));
        }
        resolve();
      });
    }).end();
  });
}

// Insertar con las columnas básicas
function insertLead(data) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(data);
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
      res.on("end", () => {
        console.log("POST Status:", res.statusCode);
        console.log("Response:", d.substring(0, 500));
        resolve(res.statusCode);
      });
    });
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log("=== PASO 1: Verificar columnas de la tabla ===");
  await getColumns();

  console.log("\n=== PASO 2: Insertar lead mínimo (solo nombre y telefono) ===");
  const minResult = await insertLead({ nombre: "Test Mínimo", telefono: "3001112222" });
  if (minResult === 201) console.log("✅ INSERT MÍNIMO: EXITOSO");
  else console.log("❌ INSERT MÍNIMO: FALLÓ");

  console.log("\n=== PASO 3: Insertar lead con más campos ===");
  const fullResult = await insertLead({
    nombre: "Test Completo",
    telefono: "3009998877",
    empresa: "Test Corp",
    email: "test@corp.com",
    requerimiento: "Prueba completa"
  });
  if (fullResult === 201) console.log("✅ INSERT COMPLETO: EXITOSO");
  else console.log("❌ INSERT COMPLETO: FALLÓ");

  console.log("\n=== PASO 4: Leer todos los leads ===");
  await getColumns();
}

main();
