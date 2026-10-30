import React, { useState } from 'react';
import type { Cliente } from '../App';
import ClienteCategoriaBadge, { CATEGORIAS_CLIENTE, type CategoriaCliente } from '../components/ClienteCategoriaBadge';

interface IProps {
  clientes: Cliente[];
  onAdd: (c: Cliente) => void;
  onUpdate: (c: Cliente) => void;
  onDelete: (id: string) => void;
  userRole: string;
}

const ClientesModule: React.FC<IProps> = ({ clientes, onAdd, onUpdate, onDelete, userRole }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Cliente>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<'TODAS' | CategoriaCliente>('TODAS');

  const filteredClientes = (clientes || []).filter(c => {
    const matchesSearch =
      (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.nit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contacto || '').toLowerCase().includes(searchTerm.toLowerCase());
    const cat = (c.categoria || 'A') as CategoriaCliente;
    const matchesCat = selectedCatFilter === 'TODAS' || cat === selectedCatFilter;
    return matchesSearch && matchesCat;
  });

  const handleSave = () => {
    if (formData.nombre && formData.nit) {
      const dataWithCat = { ...formData, categoria: formData.categoria || 'A' };
      if (editingId) {
        onUpdate({ ...dataWithCat, id: editingId } as Cliente);
        setEditingId(null);
      } else {
        onAdd({ ...dataWithCat, id: crypto.randomUUID() } as Cliente);
        setIsAdding(false);
      }
      setFormData({});
    }
  };

  const startEdit = (c: Cliente) => {
    setFormData(c);
    setEditingId(c.id);
    setIsAdding(false);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <div>
          <h2>Gestión de Clientes</h2>
          <div className="search-container" style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-field search-input"
              placeholder="🔍 Buscar por nombre, NIT o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '300px', borderRadius: '20px', paddingLeft: '2.5rem' }}
            />
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filtrar:</span>
              <button
                type="button"
                onClick={() => setSelectedCatFilter('TODAS')}
                style={{
                  padding: '3px 9px',
                  borderRadius: '14px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedCatFilter === 'TODAS' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: selectedCatFilter === 'TODAS' ? '#e0f2fe' : '#ffffff',
                  color: selectedCatFilter === 'TODAS' ? '#0369a1' : '#64748b'
                }}
              >
                Todas ({clientes.length})
              </button>
              {(['A', 'B', 'C', 'D'] as const).map(catKey => {
                const count = (clientes || []).filter(c => (c.categoria || 'A') === catKey).length;
                const isSelected = selectedCatFilter === catKey;
                const cfg = CATEGORIAS_CLIENTE[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCatFilter(catKey)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: '14px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1.5px solid ' + cfg.border,
                      background: isSelected ? cfg.border : cfg.bg,
                      color: isSelected ? '#ffffff' : cfg.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: cfg.dotColor }} />
                    {catKey} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({}); }}>+ Nuevo Cliente</button>
      </div>

      {(isAdding || editingId) && (
        <div className="card" style={{ marginBottom: '2rem', border: editingId ? '2px solid var(--primary-blue)' : 'none' }}>
          <h3>{editingId ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</h3>
          <div className="form-grid">
            <input className="input-field" placeholder="Nombre de la Empresa" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
            <input className="input-field" placeholder="NIT" value={formData.nit || ''} onChange={e => setFormData({ ...formData, nit: e.target.value })} />
            <input className="input-field" placeholder="Nombre de Contacto" value={formData.contacto || ''} onChange={e => setFormData({ ...formData, contacto: e.target.value })} />
            <input className="input-field" placeholder="Teléfono" value={formData.telefono || ''} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
            <input className="input-field" placeholder="Correo" value={formData.correo || ''} onChange={e => setFormData({ ...formData, correo: e.target.value })} />
            <input className="input-field" placeholder="Dirección" value={formData.direccion || ''} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
            <input className="input-field" placeholder="Ciudad" value={formData.ciudad || ''} onChange={e => setFormData({ ...formData, ciudad: e.target.value })} />
            <input className="input-field" placeholder="Coordenadas (Lat, Long)" value={formData.coordenadas || ''} onChange={e => setFormData({ ...formData, coordenadas: e.target.value })} />
                        <select 
              className="input-field" 
              value={formData.regimen || 'Régimen Común'} 
              onChange={e => setFormData({ ...formData, regimen: e.target.value as any })}
            >
              <option value="Régimen Común">Régimen Común</option>
              <option value="Régimen Simplificado">Régimen Simplificado</option>
            </select>

            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.25rem' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                🏷️ Clasificación de Cliente (Categoría en Colores)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {(['A', 'B', 'C', 'D'] as CategoriaCliente[]).map(catKey => {
                  const cfg = CATEGORIAS_CLIENTE[catKey];
                  const isSelected = (formData.categoria || 'A') === catKey;
                  return (
                    <div
                      key={catKey}
                      onClick={() => setFormData({ ...formData, categoria: catKey })}
                      style={{
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? cfg.dotColor : cfg.border}`,
                        background: isSelected ? cfg.bg : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: cfg.dotColor, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: cfg.color }}>Cat. {catKey}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{cfg.nombreColor}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="contact-section" style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-blue)' }}>💰 Datos de Tesorería</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <input className="input-field" placeholder="Nombre Tesorería" value={formData.tesoreriaNombre || ''} onChange={e => setFormData({ ...formData, tesoreriaNombre: e.target.value })} />
                <input className="input-field" placeholder="Teléfono" value={formData.tesoreriaTelefono || ''} onChange={e => setFormData({ ...formData, tesoreriaTelefono: e.target.value })} />
                <input className="input-field" placeholder="Correo Electrónico" value={formData.tesoreriaEmail || ''} onChange={e => setFormData({ ...formData, tesoreriaEmail: e.target.value })} />
              </div>
            </div>

            <div className="contact-section" style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-blue)' }}>📊 Datos de Contabilidad</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <input className="input-field" placeholder="Nombre Contabilidad" value={formData.contabilidadNombre || ''} onChange={e => setFormData({ ...formData, contabilidadNombre: e.target.value })} />
                <input className="input-field" placeholder="Teléfono" value={formData.contabilidadTelefono || ''} onChange={e => setFormData({ ...formData, contabilidadTelefono: e.target.value })} />
                <input className="input-field" placeholder="Correo Electrónico" value={formData.contabilidadEmail || ''} onChange={e => setFormData({ ...formData, contabilidadEmail: e.target.value })} />
              </div>
            </div>

            <div className="form-group-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={formData.poseeCredito || false}
                  onChange={e => setFormData({ ...formData, poseeCredito: e.target.checked })}
                />
                ¿Posee Crédito?
              </label>
              {formData.poseeCredito && (
                <input
                  className="input-field"
                  type="number"
                  placeholder="Cupo de Crédito ($)"
                  style={{ width: '200px' }}
                  value={formData.cupoCredito || ''}
                  onChange={e => setFormData({ ...formData, cupoCredito: Number(e.target.value) })}
                />
              )}
            </div>

            {/* SECCIÓN MÚLTIPLES COMPRADORES */}
            <div className="contact-section animate-scale-in" style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  👥 Contactos de Compras (Compradores)
                </h4>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                  onClick={() => setFormData({
                    ...formData,
                    compradores: [...(formData.compradores || []), { id: crypto.randomUUID(), nombre: '', cargo: '', telefono: '', correo: '' }]
                  })}
                >
                  + Añadir Comprador
                </button>
              </div>

              {(!formData.compradores || formData.compradores.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>No hay compradores registrados. Haz clic en "Añadir Comprador".</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formData.compradores.map((comp, idx) => (
                    <div key={comp.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(150px, 1fr) 150px minmax(150px, 1fr) 40px', gap: '0.5rem', alignItems: 'center', background: 'white', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <input className="input-field" placeholder="Nombre Completo" value={comp.nombre} onChange={e => {
                        const newComps = [...(formData.compradores || [])];
                        newComps[idx].nombre = e.target.value;
                        setFormData({ ...formData, compradores: newComps });
                      }} />
                      <input className="input-field" placeholder="Cargo" value={comp.cargo} onChange={e => {
                        const newComps = [...(formData.compradores || [])];
                        newComps[idx].cargo = e.target.value;
                        setFormData({ ...formData, compradores: newComps });
                      }} />
                      <input className="input-field" placeholder="Teléfono" value={comp.telefono} onChange={e => {
                        const newComps = [...(formData.compradores || [])];
                        newComps[idx].telefono = e.target.value;
                        setFormData({ ...formData, compradores: newComps });
                      }} />
                      <input className="input-field" placeholder="Correo" value={comp.correo} onChange={e => {
                        const newComps = [...(formData.compradores || [])];
                        newComps[idx].correo = e.target.value;
                        setFormData({ ...formData, compradores: newComps });
                      }} />
                      <button className="btn-delete" onClick={() => {
                        const newComps = [...(formData.compradores || [])];
                        newComps.splice(idx, 1);
                        setFormData({ ...formData, compradores: newComps });
                      }} title="Eliminar Comprador">🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN MÚLTIPLES SEDES */}
            <div className="contact-section animate-scale-in" style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🏢 Sedes / Locaciones
                </h4>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                  onClick={() => setFormData({
                    ...formData,
                    sedes: [...(formData.sedes || []), { id: crypto.randomUUID(), nombre: '', direccion: '', ciudad: '' }]
                  })}
                >
                  + Añadir Sede
                </button>
              </div>

              {(!formData.sedes || formData.sedes.length === 0) ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>No hay sedes registradas. Haz clic en "Añadir Sede".</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formData.sedes.map((sede, idx) => (
                    <div key={sede.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 40px', gap: '0.5rem', alignItems: 'center', background: 'white', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <input className="input-field" placeholder="Nombre Sede (Ej: Sede Norte)" value={sede.nombre} onChange={e => {
                        const newSedes = [...(formData.sedes || [])];
                        newSedes[idx].nombre = e.target.value;
                        setFormData({ ...formData, sedes: newSedes });
                      }} />
                      <input className="input-field" placeholder="Dirección Completa" value={sede.direccion} onChange={e => {
                        const newSedes = [...(formData.sedes || [])];
                        newSedes[idx].direccion = e.target.value;
                        setFormData({ ...formData, sedes: newSedes });
                      }} />
                      <input className="input-field" placeholder="Ciudad" value={sede.ciudad} onChange={e => {
                        const newSedes = [...(formData.sedes || [])];
                        newSedes[idx].ciudad = e.target.value;
                        setFormData({ ...formData, sedes: newSedes });
                      }} />
                      <button className="btn-delete" onClick={() => {
                        const newSedes = [...(formData.sedes || [])];
                        newSedes.splice(idx, 1);
                        setFormData({ ...formData, sedes: newSedes });
                      }} title="Eliminar Sede">🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          <div className="form-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button onClick={handleSave} className="btn-success">{editingId ? 'Actualizar' : 'Guardar'}</button>
            <button className="btn-secondary" onClick={cancel}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card table-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Nombre Cliente</th>
                <th style={{ minWidth: '90px' }}>Categoría</th>
                <th style={{ minWidth: '120px' }}>NIT</th>
                <th style={{ minWidth: '150px' }}>Contacto Comercial</th>
                <th style={{ minWidth: '180px' }}>Contactos Financieros</th>
                <th style={{ minWidth: '150px' }}>Crédito</th>
                <th style={{ minWidth: '120px' }}>Régimen</th>
                <th style={{ minWidth: '120px' }}>Dirección</th>
                <th className="text-center" style={{ minWidth: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>{c.nombre}</strong>
                      <ClienteCategoriaBadge categoria={c.categoria} size="sm" />
                    </div>
                    <small>{c.correo}</small>
                  </td>
                  <td>
                    <select
                      value={c.categoria || 'A'}
                      onChange={(e) => {
                        const newCat = e.target.value as CategoriaCliente;
                        onUpdate({ ...c, categoria: newCat });
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: CATEGORIAS_CLIENTE[(c.categoria || 'A') as CategoriaCliente]?.bg || '#fef9c3',
                        border: `1.5px solid ${CATEGORIAS_CLIENTE[(c.categoria || 'A') as CategoriaCliente]?.border || '#facc15'}`,
                        color: CATEGORIAS_CLIENTE[(c.categoria || 'A') as CategoriaCliente]?.color || '#854d0e',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                      title="Haz clic para cambiar la clasificación de este cliente"
                    >
                      <option value="A">🟡 Cat. A (Amarillo - Estándar)</option>
                      <option value="B">🟢 Cat. B (Verde - VIP / Frecuente)</option>
                      <option value="C">🔴 Cat. C (Rojo - Crítico / Mora)</option>
                      <option value="D">🟠 Cat. D (Naranja - Prospecto / Nuevo)</option>
                    </select>
                  </td>
                  <td>{c.nit}</td>
                  <td>{c.contacto}<br /><small>{c.telefono}</small></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', lineHeight: '1.4' }}>
                      {/* Mostrar Compradores */}
                      {c.compradores && c.compradores.length > 0 && (
                        <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: '0.5rem' }}>
                          <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4338ca' }}>
                            👥 Compradores ({c.compradores.length})
                          </strong>
                          {c.compradores.map(comp => (
                            <div key={comp.id} style={{ marginTop: '4px', paddingBottom: '4px', borderBottom: '1px dashed #e2e8f0' }}>
                              <span style={{ fontWeight: 'bold' }}>{comp.nombre}</span> <span style={{ color: '#64748b' }}>({comp.cargo})</span><br />
                              <span style={{ color: '#64748b' }}>📞 {comp.telefono} | 📧 {comp.correo}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {(formData.tesoreriaNombre || c.tesoreriaNombre) && (
                        <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '0.5rem' }}>
                          <strong style={{ display: 'block' }}>💰 Tesorería: {c.tesoreriaNombre}</strong>
                          <span style={{ display: 'block', color: '#64748b' }}>📞 {c.tesoreriaTelefono || 'N/A'}</span>
                          <span style={{ display: 'block', color: '#64748b' }}>📧 {c.tesoreriaEmail || 'N/A'}</span>
                        </div>
                      )}
                      {(formData.contabilidadNombre || c.contabilidadNombre) && (
                        <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '0.5rem' }}>
                          <strong style={{ display: 'block' }}>📊 Contabilidad: {c.contabilidadNombre}</strong>
                          <span style={{ display: 'block', color: '#64748b' }}>📞 {c.contabilidadTelefono || 'N/A'}</span>
                          <span style={{ display: 'block', color: '#64748b' }}>📧 {c.contabilidadEmail || 'N/A'}</span>
                        </div>
                      )}
                      {(!c.compradores?.length) && !c.tesoreriaNombre && !c.contabilidadNombre && <span style={{ opacity: 0.3 }}>Sin contactos</span>}
                    </div>
                  </td>
                  <td>
                  <div style={{ fontSize: '0.9rem' }}>
                    <strong>{c.poseeCredito ? 'SÍ' : 'NO'}</strong>
                    {c.poseeCredito && <div>Cupo: ${c.cupoCredito?.toLocaleString()}</div>}
                  </div>
                </td>
                <td>
                  <span className={`badge ${c.regimen === 'Régimen Simplificado' ? 'badge-simplificado' : 'badge-comun'}`} style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: c.regimen === 'Régimen Simplificado' ? '#fef3c7' : '#e0f2fe',
                    color: c.regimen === 'Régimen Simplificado' ? '#92400e' : '#0369a1'
                  }}>
                    {c.regimen || 'Régimen Común'}
                  </span>
                </td>
                  <td>
                    {c.direccion}<br />
                    <small><strong>{c.ciudad || ''}</strong></small><br />
                    <small><code>{c.coordenadas || ''}</code></small>

                    {/* Mostrar Sedes */}
                    {c.sedes && c.sedes.length > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '0.82rem', borderLeft: '3px solid #f59e0b', paddingLeft: '0.5rem' }}>
                        <strong style={{ color: '#b45309', display: 'block', marginBottom: '4px' }}>🏢 Sedes Adicionales ({c.sedes.length})</strong>
                        {c.sedes.map(sede => (
                          <div key={sede.id} style={{ marginBottom: '4px', lineHeight: '1.3' }}>
                            <strong>{sede.nombre}:</strong> {sede.direccion} <span style={{ color: '#64748b' }}>({sede.ciudad})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn-edit" onClick={() => startEdit(c)}>✏️</button>
                      {userRole === 'Admin' && (
                        <button className="btn-delete-icon" onClick={() => { if (window.confirm('¿Eliminar este cliente?')) onDelete(c.id) }}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .search-container {
          position: relative;
        }

        .search-input {
          transition: all 0.3s ease;
          border: 1px solid var(--border-color);
        }

        .search-input:focus {
          width: 450px !important;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 4px var(--secondary-blue);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .table-card {
          padding: 0;
          overflow: hidden;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .data-table th {
          background-color: var(--secondary-blue);
          color: var(--primary-blue);
          padding: 1rem;
          font-weight: 600;
        }

        .data-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .data-table tr:hover {
          background-color: #f8fafc;
        }

        .btn-secondary {
          background-color: #cbd5e1;
          color: var(--text-main);
        }

        .btn-secondary:hover {
          background-color: #94a3b8;
        }

        .btn-edit, .btn-delete-icon {
          background: none;
          border: 1px solid var(--border-color);
          padding: 0.4rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .btn-edit:hover {
          background: var(--secondary-blue);
          border-color: var(--primary-blue);
        }

        .btn-delete-icon:hover {
          background: #fee2e2;
          border-color: var(--error);
        }

        .btn-success {
          background-color: var(--success);
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ClientesModule;
