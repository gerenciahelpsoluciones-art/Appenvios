"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Client {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  notas: string;
  total_comprado: number;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    notas: ""
  });

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("velia_clientes")
      .select("*")
      .order("total_comprado", { ascending: false });
    
    if (data) setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingClient) {
        const { error } = await supabase
          .from("velia_clientes")
          .update(formData)
          .eq("id", editingClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("velia_clientes").insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nombre: client.nombre,
      telefono: client.telefono,
      email: client.email,
      notas: client.notas || ""
    });
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.telefono.includes(searchTerm)
  );

  return (
    <div className="animate-fade">
      <header className="page-header">
        <div>
          <h1 className="font-playfair">Gestión de Clientes</h1>
          <p>Base de datos de clientes exclusivos y preferenciales</p>
        </div>
        <button className="btn-emerald" onClick={() => { setEditingClient(null); setFormData({nombre:"", telefono:"", email:"", notas:""}); setIsModalOpen(true); }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Cliente
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
         <div className="velia-card stat-card">
            <p className="stat-label">Total Clientes</p>
            <p className="stat-value">{clients.length}</p>
         </div>
         <div className="velia-card stat-card">
            <p className="stat-label">Ticket Promedio</p>
            <p className="stat-value" style={{ color: "var(--velia-emerald)" }}>
              ${clients.length ? Math.round(clients.reduce((acc, c) => acc + c.total_comprado, 0) / clients.length).toLocaleString("es-CO") : 0}
            </p>
         </div>
      </div>

      <section className="velia-card" style={{ padding: "0" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <h2 className="font-playfair" style={{ fontSize: "1.3rem" }}>Directorio Premium</h2>
           <div className="search-bar" style={{ width: "300px" }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Contacto</th>
                <th>Total Comprado</th>
                <th>Estatus</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && clients.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>Cargando clientes...</td></tr>
              ) : filteredClients.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: "700" }}>{c.nombre}</div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>{c.email || "Sin correo"}</div>
                  </td>
                  <td style={{ opacity: 0.8 }}>{c.telefono}</td>
                  <td>
                    <div style={{ fontWeight: "700", color: "var(--velia-emerald)" }}>${c.total_comprado.toLocaleString("es-CO")}</div>
                  </td>
                  <td>
                    {c.total_comprado > 1000000 ? (
                      <span style={{ padding: "0.2rem 0.6rem", background: "rgba(184, 134, 11, 0.1)", color: "darkgoldenrod", borderRadius: "100px", fontSize: "0.7rem", fontWeight: "800" }}>💎 VIP GOLD</span>
                    ) : (
                      <span style={{ padding: "0.2rem 0.6rem", background: "rgba(6, 78, 59, 0.05)", color: "var(--velia-emerald)", borderRadius: "100px", fontSize: "0.7rem" }}>Regular</span>
                    )}
                  </td>
                  <td>
                    <button className="edit" onClick={() => openEdit(c)}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2 className="font-playfair">{editingClient ? "Editar Cliente" : "Registrar Nuevo Cliente"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.telefono}
                      onChange={e => setFormData({...formData, telefono: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notas Adicionales</label>
                  <textarea 
                    className="form-input" 
                    rows={3}
                    value={formData.notas}
                    onChange={e => setFormData({...formData, notas: e.target.value})}
                    placeholder="Preferencias, tallas, fragancias favoritas..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-emerald" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
