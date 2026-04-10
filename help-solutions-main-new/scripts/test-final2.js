const https = require("https");
const fs = require("fs");

const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdHlqeXNpbmVnYmliZHd6aG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzczNTYsImV4cCI6MjA4NzExMzM1Nn0.sujolHHtMEsNs7EPlLYchAZRCLyMz7ek62x5eQ0h0kY";

function doRequest(method, path, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: "matyjysinegbibdwzhoq.supabase.co",
      path: path,
      method: method,
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" }
    };
    if (body) options.headers["Content-Length"] = Buffer.byteLength(body);
    const req = https.request(options, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const log = [];
  
  // 1. Get columns
  const r1 = await doRequest("GET", "/rest/v1/clientes_web?select=*&limit=1");
  log.push(`GET columns: ${r1.status}`);
  try {
    const rows = JSON.parse(r1.body);
    if (rows.length > 0) log.push(`Columnas: ${Object.keys(rows[0]).join(", ")}`);
  } catch(e) { log.push(`Error: ${r1.body.substring(0,200)}`); }
  
  // 2. Insert minimal
  const r2 = await doRequest("POST", "/rest/v1/clientes_web", JSON.stringify({ nombre: "Test Final Script", telefono: "3001112222", requerimiento: "Prueba automática" }));
  log.push(`POST minimal: ${r2.status}`);
  log.push(`POST response: ${r2.body.substring(0,300)}`);
  
  // 3. Read last 3
  const r3 = await doRequest("GET", "/rest/v1/clientes_web?select=id,nombre,telefono,requerimiento,created_at&order=created_at.desc&limit=3");
  log.push(`GET leads: ${r3.status}`);
  log.push(`Leads: ${r3.body.substring(0,500)}`);

  // Write to file
  const output = log.join("\n");
  console.log(output);
  fs.writeFileSync("scripts/test-output.txt", output);
}

main();
