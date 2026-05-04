"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Bypass para demo
      if (identifier === "admin" && password === "admin") {
        document.cookie = "velia_demo=true; path=/; max-age=3600";
        router.push("/");
        return;
      }

      // 2. Resolver Usuario a Email
      const res = await fetch("/api/auth/get-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: identifier })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        throw new Error(`Error del servidor (${res.status}): ${errorText.substring(0, 50)}`);
      }

      const { email, error: fetchError } = await res.json();
      
      if (fetchError || !email) {
        // Si no se encuentra como usuario, intentamos tratar el identificador como email directamente
        // por si acaso alguien prefiere usar el correo
        const finalEmail = identifier.includes("@") ? identifier : null;
        if (!finalEmail) throw new Error("Usuario no encontrado");

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password: password + "_veliapremium",
        });
        if (authError) throw authError;
      } else {
        // 3. Autenticar con el email resuelto
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: password + "_veliapremium",
        });
        if (authError) throw authError;
      }

      router.push("/");
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(circle at top right, var(--velia-emerald), #022c22)",
      padding: "2rem"
    }}>
      <div className="velia-card animate-fade" style={{ maxWidth: "450px", width: "100%", padding: "3.5rem 2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <img src="/logo.png" alt="VELIA Logo" style={{ width: "80px", marginBottom: "1rem" }} />
          <h1 className="font-playfair" style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>Bienvenido a VELIA</h1>
          <p style={{ opacity: 0.6 }}>Gestión de Inventario Premium</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Nombre de Usuario</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: carlos_ventas"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          </div>

          <div className="form-group" style={{ marginTop: "1.5rem" }}>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ background: "rgba(255,255,255,0.03)" }}
            />
          </div>

          {error && (
            <div style={{
              marginTop: "1.5rem",
              padding: "0.75rem",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.1)",
              color: "var(--velia-danger)",
              fontSize: "0.85rem",
              textAlign: "center",
              border: "1px solid rgba(239, 68, 68, 0.2)"
            }}>
              {error === "Invalid login credentials" ? "Credenciales inválidas" : error}
            </div>
          )}

          <button
            type="submit"
            className="btn-emerald"
            disabled={loading}
            style={{ width: "100%", marginTop: "2rem", padding: "1rem" }}
          >
            {loading ? "Iniciando..." : "Acceder al Sistema"}
          </button>
        </form>

        <p style={{ marginTop: "2.5rem", textAlign: "center", fontSize: "0.75rem", opacity: 0.4 }}>
          Acceso restringido solo para personal autorizado de VELIA S.A.S.
        </p>
      </div>
    </div>
  );
}
