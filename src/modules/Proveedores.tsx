import React, { useState } from 'react';
import type { Proveedor } from '../App';

interface IProps {
    proveedores: Proveedor[];
    onAdd: (p: Proveedor) => void;
    onUpdate: (p: Proveedor) => void;
    onDelete: (id: string) => void;
}

const ProveedoresModule: React.FC<IProps> = ({ proveedores, onAdd, onUpdate, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Proveedor>>({});

    const handleSave = () => {
        if (formData.nombre) {
            const proveedorData = {
                ...formData,
                direccion: formData.direccion || '',
                coordenadas: formData.coordenadas || '',
                nit: formData.nit || '',
                contacto: formData.contacto || '',
                telefono: formData.telefono || '',
                correo: formData.correo || ''
            };

            if (editingId) {
                onUpdate({ ...proveedorData, id: editingId } as Proveedor);
                setEditingId(null);
            } else {
                onAdd({ ...proveedorData, id: Date.now().toString() } as Proveedor);
                setIsAdding(false);
            }
            setFormData({});
        }
    };

    const startEdit = (p: Proveedor) => {
        setFormData(p);
        setEditingId(p.id);
        setIsAdding(false);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({});
    };

    return (
        <div className="module-container" style={{ maxWidth: '1400px' }}>
            <div className="module-header">
                <h2>Gestión de Proveedores</h2>
                <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({}); }}>+ Nuevo Proveedor</button>
            </div>

            {(isAdding || editingId) && (
                <div className="card" style={{ marginBottom: '2rem', border: editingId ? '2px solid var(--primary-blue)' : 'none' }}>
                    <h3>{editingId ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}</h3>
                    <div className="form-grid-modern">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nombre del Proveedor</label>
                                <input className="input-field" placeholder="Ej: Distribuidora S.A.S" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>NIT</label>
                                <input className="input-field" placeholder="900.000.000-0" value={formData.nit || ''} onChange={e => setFormData({ ...formData, nit: e.target.value })} />
                            </div>
                            <div className="form-group flex-1">
                                <label>Persona de Contacto</label>
                                <input className="input-field" placeholder="Nombre completo" value={formData.contacto || ''} onChange={e => setFormData({ ...formData, contacto: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Teléfono</label>
                                <input className="input-field" placeholder="Ej: 300 123 4567" value={formData.telefono || ''} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                            </div>
                            <div className="form-group flex-1">
                                <label>Correo Electrónico</label>
                                <input className="input-field" type="email" placeholder="ejemplo@correo.com" value={formData.correo || ''} onChange={e => setFormData({ ...formData, correo: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Coordenadas (Lat, Long)</label>
                                <input className="input-field" placeholder="4.6097, -74.0817" value={formData.coordenadas || ''} onChange={e => setFormData({ ...formData, coordenadas: e.target.value })} />
                            </div>
                            <div className="form-group flex-2">
                                <label>Dirección</label>
                                <input className="input-field" placeholder="Calle 123 #45-67" value={formData.direccion || ''} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={cancel}>Cancelar</button>
                        <button onClick={handleSave} className="btn-success">{editingId ? 'Guardar Cambios' : 'Añadir Proveedor'}</button>
                    </div>
                </div>
            )}

            <div className="card table-card" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: '1000px' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '20%' }}>Proveedor</th>
                            <th style={{ width: '15%' }}>NIT</th>
                            <th style={{ width: '30%' }}>Contacto / Tel / Correo</th>
                            <th style={{ width: '25%' }}>Ubicación (Dir / Coords)</th>
                            <th style={{ width: '100px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proveedores.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <div className="font-bold">{p.nombre}</div>
                                </td>
                                <td>{p.nit}</td>
                                <td>
                                    <div style={{ fontSize: '0.9rem' }}>
                                        <div><strong>{p.contacto}</strong></div>
                                        <div className="text-muted">{p.telefono}</div>
                                        <div className="text-muted">{p.correo}</div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.9rem' }}>
                                        <div>{p.direccion}</div>
                                        {p.coordenadas && <code className="coords-badge">📍 {p.coordenadas}</code>}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn-action btn-edit" onClick={() => startEdit(p)} title="Editar">✏️</button>
                                        <button className="btn-action btn-delete" onClick={() => { if (window.confirm('¿Eliminar este proveedor?')) onDelete(p.id) }} title="Eliminar">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style>{`
        .form-grid-modern {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 1.5rem;
        }
        .form-row {
          display: flex;
          gap: 1.5rem;
          width: 100%;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .flex-2 { flex: 2; }
        .flex-1 { flex: 1; }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .text-muted { color: var(--text-muted); }
        .coords-badge {
          display: inline-block;
          margin-top: 0.3rem;
          background: var(--secondary-blue);
          color: var(--primary-blue);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
        }
        .btn-action {
          background: white;
          border: 1px solid var(--border-color);
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }
        .btn-action:hover {
          background: var(--background-light);
          border-color: var(--primary-blue);
          transform: translateY(-1px);
        }
        .btn-edit:hover { color: var(--primary-blue); border-color: var(--primary-blue); }
        .btn-delete:hover { color: var(--error); border-color: var(--error); background: #fff5f5; }
        
        .btn-secondary { background: white; color: var(--text-main); border: 1px solid var(--border-color); }
        .btn-secondary:hover { background: var(--background-light); }
        .btn-success { background: var(--success); color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer; }
        .font-bold { font-weight: 600; }
        
        .data-table th {
            font-size: 0.85rem;
            font-weight: 600;
            background: var(--secondary-blue);
            color: var(--primary-blue);
        }
      `}</style>
        </div>
    );
};

export default ProveedoresModule;
