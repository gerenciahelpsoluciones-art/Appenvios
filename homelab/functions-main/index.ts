// Enrutador de funciones del edge-runtime: /functions/v1/<nombre> → carpeta <nombre>.
// Cada función revisa por sí misma quién la llama (supabase/functions/_shared/crm-auth.ts).
const PERMITIDAS = new Set(['send-email', 'siigo-proxy']);

Deno.serve(async (req: Request) => {
  const nombre = new URL(req.url).pathname.split('/')[1] ?? '';
  if (!PERMITIDAS.has(nombre)) {
    return new Response(JSON.stringify({ error: 'Función no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const envVars = Object.entries(Deno.env.toObject());
  try {
    // @ts-ignore EdgeRuntime lo provee el contenedor supabase/edge-runtime
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath: `/home/deno/functions/${nombre}`,
      memoryLimitMb: 150,
      workerTimeoutMs: 5 * 60 * 1000,   // la sincronización de Siigo hace muchas consultas
      noModuleCache: false,
      importMapPath: null,
      envVars,
    });
    return await worker.fetch(req);
  } catch (e) {
    console.error(`Error en la función ${nombre}:`, e);
    return new Response(JSON.stringify({ error: 'Error interno de la función' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
