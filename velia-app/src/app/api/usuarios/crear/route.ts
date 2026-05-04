import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const { email, password, nombre, usuario, rol } = await request.json();

  try {
    // 1. Crear el usuario en Auth (con confirmación automática)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password + "_veliapremium",
      email_confirm: true,
      user_metadata: { 
        full_name: nombre,
        usuario: usuario,
        app: "velia"
      }
    });

    if (authError) throw authError;

    // 2. Crear el perfil en la tabla de perfiles (por si el trigger tarda o falla)
    const { error: profileError } = await supabaseAdmin.from("velia_perfiles").insert([{
      id: authData.user.id,
      nombre,
      usuario,
      email,
      rol,
      estado: "activo"
    }]);

    // Ignoramos error de perfil si es por duplicidad (el trigger ya lo hizo)
    
    return NextResponse.json({ success: true, user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
