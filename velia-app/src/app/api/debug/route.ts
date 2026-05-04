import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurado ✅" : "FALTANTE ❌",
    service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Configurado ✅" : "FALTANTE ❌ (Urgente)",
    anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurado ✅" : "FALTANTE ❌",
    env: process.env.NODE_ENV
  });
}
