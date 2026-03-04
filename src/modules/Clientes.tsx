import React, { useState } from 'react';
import type { Cliente } from '../App';

interface IProps {
  clientes: Cliente[];
  onAdd: (c: Cliente) => void;
  onUpdate: (c: Cliente) => void;
  onDelete: (id: string) => void;
}

const ClientesModule: React.FC<IProps> = ({ clientes, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Cliente>>({});

  const handleSave = () => {
    if (formData.nombre && formData.nit) {
      if (editingId) {
        onUpdate({ ...formData, id: editingId } as Cliente);
        setEditingId(null);
      } else {
        onAdd({ ...formData, id: Date.now().toString() } as Cliente);
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
        <h2>Gestión de Clientes</h2>
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
                <th style={{ minWidth: '120px' }}>NIT</th>
                <th style={{ minWidth: '150px' }}>Contacto Comercial</th>
                <th style={{ minWidth: '180px' }}>Contactos Financieros</th>
                <th style={{ minWidth: '150px' }}>Crédito</th>
                <th style={{ minWidth: '120px' }}>Dirección</th>
                <th className="text-center" style={{ minWidth: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.nombre}</strong><br /><small>{c.correo}</small></td>
                  <td>{c.nit}</td>
                  <td>{c.contacto}<br /><small>{c.telefono}</small></td>
                  <td>
                    <div style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                      {(formData.tesoreriaNombre || c.tesoreriaNombre) && (
                        <div style={{ marginBottom: '0.5rem', borderLeft: '3px solid #10b981', paddingLeft: '0.5rem' }}>
                          <strong style={{ display: 'block' }}>💰 {c.tesoreriaNombre}</strong>
                          <span style={{ display: 'block', color: '#64748b' }}>📞 {c.tesoreriaTelefono || 'N/A'}</span>
                          <span style={{ display: 'block', color: '#64748b' }}>📧 {c.tesoreriaEmail || 'N/A'}</span>
                        </div>
                      )}
                      {(formData.contabilidadNombre || c.contabilidadNombre) && (
                        <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '0.5rem' }}>
                          <strong style={{ display: 'block' }}>📊 {c.contabilidadNombre}</strong>
                          <span style={{ display: 'block', color: '#64748b' }}>📞 {c.contabilidadTelefono || 'N/A'}</span>
                          <span style={{ display: 'block', color: '#64748b' }}>📧 {c.contabilidadEmail || 'N/A'}</span>
                        </div>
                      )}
                      {!c.tesoreriaNombre && !c.contabilidadNombre && <span style={{ opacity: 0.3 }}>Sin contactos</span>}
                    </div>
                  </td>
                  <td>
                    {c.poseeCredito ? (
                      <span className="doc-badge active" title={`Cupo: $${c.cupoCredito}`}>
                        💳 ${c.cupoCredito?.toLocaleString()}
                      </span>
                    ) : (
                      <span className="doc-badge" style={{ opacity: 0.3 }}>Sin Crédito</span>
                    )}
                  </td>
                  <td>{c.direccion}<br /><small><strong>{c.ciudad || ''}</strong></small><br /><small><code>{c.coordenadas || ''}</code></small></td>
                  <td className="text-center">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn-edit" onClick={() => startEdit(c)}>✏️</button>
                      <button className="btn-delete-icon" onClick={() => { if (window.confirm('¿Eliminar este cliente?')) onDelete(c.id) }}>🗑️</button>
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
          align-items: center;
          margin-bottom: 2rem;
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
