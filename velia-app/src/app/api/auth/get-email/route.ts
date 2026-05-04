import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { usuario } = await request.json();

    if (!usuario) {
      return NextResponse.json({ error: "Usuario requerido" }, { status: 400 });
    }

    // Buscar el email asociado al nombre de usuario
    const { data, error } = await supabaseAdmin
      .from("velia_perfiles")
      .select("email")
      .eq("usuario", usuario)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ email: data.email });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
