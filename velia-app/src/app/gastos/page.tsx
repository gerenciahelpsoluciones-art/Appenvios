"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Gasto {
  id: string;
  descripcion: string;
  categoria: string;
  monto: number;
  fecha: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    descripcion: "",
    categoria: "Insumos",
    monto: 0,
    fecha: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("velia_gastos")
      .select("*")
      .order("fecha", { ascending: false });
    
    if (data) setExpenses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("velia_gastos").insert([{
        ...formData,
        usuario_id: user?.id,
        monto: Number(formData.monto)
      }]);
      if (error) throw error;
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalMonthly = expenses.reduce((acc, g) => acc + g.monto, 0);

  return (
    <div className="animate-fade">
      <header className="page-header">
        <div>
          <h1 className="font-playfair">Control de Gastos</h1>
          <p>Registro de egresos operativos y suministros</p>
        </div>
        <button className="btn-emerald" onClick={() => setIsModalOpen(true)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Registrar Gasto
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
         <div className="velia-card stat-card" style={{ borderLeft: "4px solid var(--velia-danger)" }}>
            <p className="stat-label">Gasto Total Acumulado</p>
            <p className="stat-value" style={{ color: "var(--velia-danger)" }}>${totalMonthly.toLocaleString("es-CO")}</p>
         </div>
         <div className="velia-card stat-card">
            <p className="stat-label">Categoría Principal</p>
            <p className="stat-value" style={{ fontSize: "1.5rem" }}>Insumos y Empaques</p>
         </div>
      </div>

      <section className="velia-card" style={{ padding: "0" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)" }}>
           <h2 className="font-playfair" style={{ fontSize: "1.3rem" }}>Historial de Egresos</h2>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {loading && expenses.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>Cargando historial...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>No hay gastos registrados.</td></tr>
              ) : expenses.map(g => (
                <tr key={g.id}>
                  <td style={{ opacity: 0.6 }}>{new Date(g.fecha).toLocaleDateString()}</td>
                  <td style={{ fontWeight: "600" }}>{g.descripcion}</td>
                  <td>
                    <span style={{ 
                      padding: "0.2rem 0.6rem", 
                      background: "rgba(255,255,255,0.05)", 
                      borderRadius: "100px", 
                      fontSize: "0.7rem",
                      border: "1px solid var(--glass-border)"
                    }}>
                      {g.categoria}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "700", color: "var(--velia-danger)" }}>-${g.monto.toLocaleString("es-CO")}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h2 className="font-playfair">Registrar Nuevo Gasto</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Ej: Pago arriendo local, Insumos empaque..."
                    value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select 
                    className="form-select"
                    value={formData.categoria}
                    onChange={e => setFormData({...formData, categoria: e.target.value})}
                  >
                    <option value="Insumos">Insumos y Empaques</option>
                    <option value="Sueldos">Sueldos y Comisiones</option>
                    <option value="Arriendo">Arriendo y Servicios</option>
                    <option value="Marketing">Marketing y Publicidad</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monto (COP)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      value={formData.monto}
                      onChange={e => setFormData({...formData, monto: Number(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formData.fecha}
                      onChange={e => setFormData({...formData, fecha: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-emerald" disabled={loading}>
                  Registrar Egresos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
