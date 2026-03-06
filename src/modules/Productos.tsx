import React, { useState } from 'react';
import type { Producto } from '../App';
import InventarioModule from './Inventario';

interface IProps {
    productos: Producto[];
    onAdd: (p: Producto) => void;
    onUpdate: (p: Producto) => void;
    onDelete: (id: string) => void;
}

const ProductosModule: React.FC<IProps> = ({ productos, onAdd, onUpdate, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'locales' | 'siigo'>('locales');
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<Producto>>({
        nombre: '',
        numPart: '',
        descripcion: '',
        unidad: 'Und',
        precioCompra: 0,
        exentoIva: false
    });

    const handleSave = () => {
        if (formData.nombre) {
            if (editingId) {
                const existing = productos.find(p => p.id === editingId);
                const updated: Producto = {
                    ...formData as Producto,
                    id: editingId,
                    history: existing ? [...existing.history, { date: new Date().toISOString().split('T')[0], price: formData.precioCompra || 0 }] : []
                };
                onUpdate(updated);
                setEditingId(null);
            } else {
                const prod: Producto = {
                    ...formData as Producto,
                    id: crypto.randomUUID(),
                    history: [{ date: new Date().toISOString().split('T')[0], price: formData.precioCompra || 0 }]
                };
                onAdd(prod);
                setIsAdding(false);
            }
            setFormData({ nombre: '', numPart: '', descripcion: '', unidad: 'Und', precioCompra: 0, exentoIva: false });
        }
    };

    const startEdit = (p: Producto) => {
        setFormData(p);
        setEditingId(p.id);
        setIsAdding(false);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ nombre: '', numPart: '', descripcion: '', unidad: 'Und', precioCompra: 0, exentoIva: false });
    };

    return (
        <div className="module-container">
            <div className="inner-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button
                    className={`tab-btn ${activeTab === 'locales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('locales')}
                    style={{ background: 'transparent', border: 'none', color: activeTab === 'locales' ? 'var(--primary-blue)' : 'var(--text-muted)', fontWeight: activeTab === 'locales' ? 700 : 500, borderBottom: activeTab === 'locales' ? '3px solid var(--primary-blue)' : 'none', padding: '0.5rem 1rem', fontSize: '1.1rem' }}
                >
                    📦 Catálogo Local
                </button>
                <button
                    className={`tab-btn ${activeTab === 'siigo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('siigo')}
                    style={{ background: 'transparent', border: 'none', color: activeTab === 'siigo' ? 'var(--primary-blue)' : 'var(--text-muted)', fontWeight: activeTab === 'siigo' ? 700 : 500, borderBottom: activeTab === 'siigo' ? '3px solid var(--primary-blue)' : 'none', padding: '0.5rem 1rem', fontSize: '1.1rem' }}
                >
                    🗄️ Inventario Siigo Nube
                </button>
            </div>

            {activeTab === 'siigo' ? (
                <InventarioModule />
            ) : (
                <>
                    <div className="module-header">
                        <div>
                            <h2>Catálogo de Productos</h2>
                            <div className="search-container" style={{ marginTop: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="input-field search-input"
                                    placeholder="🔍 Buscar por nombre o N° Parte..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '350px', borderRadius: '20px', paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>
                        <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ nombre: '', numPart: '', descripcion: '', unidad: 'Und', precioCompra: 0, exentoIva: false }); }}>+ Nuevo Producto</button>
                    </div>

                    {(isAdding || editingId) && (
                        <div className="card" style={{ marginBottom: '2rem', border: editingId ? '2px solid var(--primary-blue)' : 'none' }}>
                            <h3>{editingId ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h3>
                            <div className="form-grid-modern">
                                <div className="form-row">
                                    <div className="form-group flex-2">
                                        <label>Nombre del Producto</label>
                                        <input className="input-field" placeholder="Ej: Laptop Pro" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                                    </div>
                                    <div className="form-group flex-1">
                                        <label>N° Parte</label>
                                        <input className="input-field" placeholder="Ref-001" value={formData.numPart} onChange={e => setFormData({ ...formData, numPart: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Descripción</label>
                                        <input className="input-field" placeholder="Detalles técnicos..." value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Unidad</label>
                                        <input className="input-field" placeholder="Und, Pza, Mts..." value={formData.unidad} onChange={e => setFormData({ ...formData, unidad: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Precio Compra</label>
                                        <input className="input-field" type="number" placeholder="0.00" value={formData.precioCompra} onChange={e => setFormData({ ...formData, precioCompra: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            id="exentoIva"
                                            checked={formData.exentoIva || false}
                                            onChange={e => setFormData({ ...formData, exentoIva: e.target.checked })}
                                            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="exentoIva" style={{ cursor: 'pointer', margin: 0, textTransform: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                            Producto Exento de IVA
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" onClick={cancel}>Cancelar</button>
                                <button onClick={handleSave} className="btn-success">{editingId ? 'Guardar Cambios' : 'Añadir Producto'}</button>
                            </div>
                        </div>
                    )}

                    <div className="card table-card">
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '200px' }}>Producto</th>
                                        <th style={{ minWidth: '150px' }}>N° Parte</th>
                                        <th style={{ minWidth: '350px' }}>Descripción</th>
                                        <th style={{ minWidth: '100px' }}>Unidad</th>
                                        <th className="text-right" style={{ minWidth: '150px' }}>Costo Actual</th>
                                        <th className="text-center" style={{ minWidth: '150px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productos.filter(p =>
                                        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (p.numPart || '').toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map(p => (
                                        <tr key={p.id}>
                                            <td><strong>
                                                {p.nombre}
                                                {p.exentoIva && <span className="exento-badge" style={{ marginLeft: '0.5rem' }}>Sin IVA</span>}
                                            </strong></td>
                                            <td><code className="part-number-badge">{p.numPart || 'N/A'}</code></td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.descripcion}</td>
                                            <td>{p.unidad}</td>
                                            <td className="text-right font-bold price-cell" style={{ fontFamily: 'Courier New, monospace' }}>
                                                ${p.precioCompra.toLocaleString()}
                                            </td>
                                            <td className="text-center">
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button className="btn-action" onClick={() => setSelectedProduct(p)} title="Ver Historial">📜</button>
                                                    <button className="btn-action btn-edit" onClick={() => startEdit(p)} title="Editar">✏️</button>
                                                    <button className="btn-action btn-delete" onClick={() => { if (window.confirm('¿Eliminar este producto?')) onDelete(p.id) }} title="Eliminar">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {
                        selectedProduct && (
                            <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                                <div className="modal-content card" onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3 style={{ margin: 0 }}>Historial de Precios</h3>
                                        <button className="btn-close" onClick={() => setSelectedProduct(null)}>×</button>
                                    </div>
                                    <p style={{ marginBottom: '1rem' }}><strong>Producto:</strong> {selectedProduct.nombre}</p>
                                    <ul className="history-list">
                                        {selectedProduct.history.map((h, i) => (
                                            <li key={i}>
                                                <span className="history-date">{h.date}</span>
                                                <span className="history-price">${h.price.toLocaleString()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )
                    }
                </>
            )}

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
        .part-number-badge {
          background: var(--secondary-blue);
          color: var(--primary-blue);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9rem;
        }
        .exento-badge {
          background: #dcfce7;
          color: #166534;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
          vertical-align: middle;
        }
        .price-cell {
          color: var(--primary-blue);
          font-size: 1.05rem;
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

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .history-list {
          list-style: none;
          max-height: 300px;
          overflow-y: auto;
        }
        .history-list li {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }
        .history-date { color: var(--text-muted); }
        .history-price { font-weight: 600; color: var(--success); }
        .btn-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .btn-close:hover { color: var(--error); }
        .btn-secondary { background: white; color: var(--text-main); border: 1px solid var(--border-color); }
        .btn-secondary:hover { background: var(--background-light); }
        .btn-success { background: var(--success); color: white; }
      `}</style>
        </div >
    );
};

export default ProductosModule;
