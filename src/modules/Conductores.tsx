import React, { useState } from 'react';
import type { Conductor, Despacho, OrdenCompra, Cliente, Proveedor } from '../App';

interface IProps {
    conductores: Conductor[];
    despachos: Despacho[];
    ordenesCompra: OrdenCompra[];
    proveedores: Proveedor[];
    clientes: Cliente[];
    onAdd: (c: Conductor) => void;
    onUpdate: (c: Conductor) => void;
    onDelete: (id: string) => void;
    onUpdateDespacho: (d: Despacho) => void;
    onUpdateOC: (oc: OrdenCompra) => void;
    onSendWhatsApp: (phone: string, message: string) => void;
}

const ConductoresModule: React.FC<IProps> = ({
    conductores,
    despachos,
    ordenesCompra,
    proveedores,
    clientes,
    onAdd,
    onUpdate,
    onDelete,
    onUpdateDespacho,
    onUpdateOC,
    onSendWhatsApp
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Conductor>>({});
    const [viewingRoutesId, setViewingRoutesId] = useState<string | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

    const handleSave = () => {
        if (formData.nombre && formData.cedula) {
            if (editingId) {
                onUpdate({ ...formData, id: editingId } as Conductor);
                setEditingId(null);
            } else {
                onAdd({ ...formData, id: Date.now().toString() } as Conductor);
                setIsAdding(false);
            }
            setFormData({});
        } else {
            alert('Por favor complete Nombre y Cédula');
        }
    };

    const handleFileChange = (field: keyof Conductor, file: File | null) => {
        if (file) {
            setFormData({ ...formData, [field]: file.name });
        }
    };

    const startEdit = (c: Conductor) => {
        setFormData(c);
        setEditingId(c.id);
        setIsAdding(false);
        setViewingRoutesId(null);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({});
    };

    const handleProofUpload = (item: any, type: 'fotoEntrega' | 'fotoRemision', isOC: boolean, file: File | null) => {
        if (!file) return;
        const updatedItem = { ...item, [type]: file.name };
        if (isOC) {
            onUpdateOC(updatedItem);
        } else {
            onUpdateDespacho(updatedItem);
        }
    };

    const openMap = (address: string) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    };

    const toggleTaskSelection = (id: string) => {
        setSelectedTasks(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const generateOptimizedRoute = () => {
        const selectedDespachos = despachos.filter(d => selectedTasks.includes(d.id));
        const selectedOCs = ordenesCompra.filter(oc => selectedTasks.includes(oc.id));

        const routePoints = [
            ...selectedDespachos.map(d => {
                // Priority: georeferencia (captured) > client coordinates > textual address
                const client = clientes.find(c => c.id === d.clienteId);
                return d.georeferencia || client?.coordenadas || d.direccion;
            }),
            ...selectedOCs.map(oc => {
                // Priority: georeferencia (captured) > provider coordinates > provider address
                const prov = proveedores.find(p => p.id === oc.proveedorId);
                return oc.georeferencia || prov?.coordenadas || prov?.direccion || oc.nombreProveedor;
            })
        ].filter(p => !!p);

        if (routePoints.length === 0) {
            alert('Seleccione al menos una parada para la ruta.');
            return;
        }

        // Google Maps Directions URL: https://www.google.com/maps/dir/Point1/Point2...
        const baseUrl = "https://www.google.com/maps/dir/";
        const routeString = routePoints.map(p => encodeURIComponent(p)).join('/');
        window.open(`${baseUrl}${routeString}`, '_blank');
    };

    const markAsCompleted = (item: any, isOC: boolean) => {
        if (isOC) {
            onUpdateOC({ ...item, estado: 'Recogido' });
        } else {
            const despacho = item as Despacho;
            onUpdateDespacho({ ...despacho, estado: 'Entregado' });

            // WhatsApp Automation
            const logisticsPhone = '+573001234567'; // Area Logistica placeholder
            const message = `✅ *Entrega Realizada*\n\nOrden: ${despacho.consecutivoCotizacion}\nCliente: ${despacho.clienteNombre}\nEstado: ENTREGADO\nConductor: ${currentConductor?.nombre || 'N/A'}`;

            // Notify Logistics
            onSendWhatsApp(logisticsPhone, `LOGÍSTICA: ${message}`);

            // Notify Commercial (if phone exists)
            if (despacho.ejecutivoTelefono) {
                setTimeout(() => {
                    onSendWhatsApp(despacho.ejecutivoTelefono!, `COMERCIAL: ${message}`);
                }, 1000);
            }
        }
    };

    const assignedDespachos = viewingRoutesId ? despachos.filter(d => d.conductorId === viewingRoutesId) : [];
    const assignedOCs = viewingRoutesId ? ordenesCompra.filter(oc => oc.conductorId === viewingRoutesId) : [];
    const currentConductor = conductores.find(c => c.id === viewingRoutesId);

    return (
        <div className="module-container">
            <div className="module-header">
                <h2>Gestión de Conductores</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({}); setViewingRoutesId(null); }}>+ Nuevo Conductor</button>
                </div>
            </div>

            {(isAdding || editingId) && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem', border: editingId ? '2px solid var(--primary-blue)' : 'none' }}>
                    <h3>{editingId ? 'Editar Conductor' : 'Añadir Nuevo Conductor'}</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nombre Completo</label>
                            <input className="input-field" placeholder="Nombre completo" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Cédula</label>
                            <input className="input-field" placeholder="Número de identificación" value={formData.cedula || ''} onChange={e => setFormData({ ...formData, cedula: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input className="input-field" placeholder="Celular" value={formData.telefono || ''} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Placa Vehículo</label>
                            <input className="input-field" placeholder="ABC-123" value={formData.placaVehiculo || ''} onChange={e => setFormData({ ...formData, placaVehiculo: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Modelo Vehículo</label>
                            <input className="input-field" placeholder="Ej: 2024" value={formData.modeloVehiculo || ''} onChange={e => setFormData({ ...formData, modeloVehiculo: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Tipo Vehículo</label>
                            <input className="input-field" placeholder="Ej: Camioneta, Camión, Moto" value={formData.tipoVehiculo || ''} onChange={e => setFormData({ ...formData, tipoVehiculo: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Tarjeta de Propiedad</label>
                            <div className="file-input-wrapper">
                                <input type="file" onChange={e => handleFileChange('tarjetaPropiedad', e.target.files?.[0] || null)} />
                                <small>{formData.tarjetaPropiedad || 'Ningún archivo'}</small>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>SOAT</label>
                            <div className="file-input-wrapper">
                                <input type="file" onChange={e => handleFileChange('soat', e.target.files?.[0] || null)} />
                                <small>{formData.soat || 'Ningún archivo'}</small>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Tecnomecánica</label>
                            <div className="file-input-wrapper">
                                <input type="file" onChange={e => handleFileChange('tecnomecanica', e.target.files?.[0] || null)} />
                                <small>{formData.tecnomecanica || 'Ningún archivo'}</small>
                            </div>
                        </div>
                    </div>
                    <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button onClick={handleSave} className="btn-success">{editingId ? 'Actualizar' : 'Guardar'}</button>
                        <button className="btn-secondary" onClick={cancel}>Cancelar</button>
                    </div>
                </div>
            )}

            {!viewingRoutesId ? (
                <div className="card table-card animate-fade-in">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '180px' }}>Nombre</th>
                                    <th style={{ minWidth: '120px' }}>Cédula</th>
                                    <th style={{ minWidth: '100px' }}>Placa</th>
                                    <th style={{ minWidth: '150px' }}>Vehículo</th>
                                    <th className="text-center" style={{ minWidth: '180px' }}>Documentación</th>
                                    <th className="text-center" style={{ minWidth: '150px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conductores.length > 0 ? conductores.map(c => (
                                    <tr key={c.id}>
                                        <td><strong>{c.nombre}</strong><br /><small>{c.telefono}</small></td>
                                        <td>{c.cedula}</td>
                                        <td><code className="part-number-badge">{c.placaVehiculo}</code></td>
                                        <td>{c.tipoVehiculo} ({c.modeloVehiculo})</td>
                                        <td className="text-center">
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                <span className={`doc-badge ${c.tarjetaPropiedad ? 'active' : ''}`}>📇 TP</span>
                                                <span className={`doc-badge ${c.soat ? 'active' : ''}`}>🛡️ S</span>
                                                <span className={`doc-badge ${c.tecnomecanica ? 'active' : ''}`}>🔧 T</span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button className="btn-route" onClick={() => setViewingRoutesId(c.id)} title="Ver Rutas">🚚</button>
                                                <button className="btn-edit" onClick={() => startEdit(c)} title="Editar">✏️</button>
                                                <button className="btn-delete-icon" onClick={() => { if (window.confirm('¿Eliminar este conductor?')) onDelete(c.id) }} title="Eliminar">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            No hay conductores registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="route-assignment-view animate-fade-in">
                    <div className="route-header">
                        <button className="btn-back" onClick={() => { setViewingRoutesId(null); setSelectedTasks([]); }}>← Volver a lista</button>
                        <div className="route-title-group">
                            <h3>Hoja de Ruta: {currentConductor?.nombre}</h3>
                            <p>{currentConductor?.placaVehiculo} • {selectedTasks.length} paradas seleccionadas</p>
                        </div>
                        <button
                            className="btn-optimize"
                            disabled={selectedTasks.length === 0}
                            onClick={generateOptimizedRoute}
                        >
                            🚀 Generar Ruta Optimizada ({selectedTasks.length})
                        </button>
                    </div>

                    <div className="tasks-grid">
                        <div className="task-column">
                            <h4>📦 Entregas (Ventas)</h4>
                            {assignedDespachos.length > 0 ? assignedDespachos.map(d => (
                                <div key={d.id} className={`task-card ${selectedTasks.includes(d.id) ? 'selected-task' : ''}`}>
                                    <div className="task-main">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span className={`status-tag status-${d.estado.toLowerCase().replace(' ', '-')}`}>{d.estado}</span>
                                            <input
                                                type="checkbox"
                                                className="task-checkbox"
                                                checked={selectedTasks.includes(d.id)}
                                                onChange={() => toggleTaskSelection(d.id)}
                                            />
                                        </div>
                                        <p>{d.clienteNombre}</p>
                                        <strong>OC: {d.consecutivoCotizacion}</strong>
                                        <small>{d.direccion}</small>
                                    </div>
                                    <div className="task-actions">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <button className="btn-geo" onClick={() => openMap(d.direccion)} title="Mapa">📍 Localizar</button>
                                            <button
                                                className="btn-complete"
                                                onClick={() => markAsCompleted(d, false)}
                                                disabled={d.estado === 'Entregado'}
                                            >
                                                🏁 Entregado
                                            </button>
                                        </div>
                                        <div className="upload-grid">
                                            <div className="upload-group">
                                                <label>📸 Foto Entrega</label>
                                                <input type="file" onChange={(e) => handleProofUpload(d, 'fotoEntrega', false, e.target.files?.[0] || null)} />
                                                {d.fotoEntrega && <span className="upload-success">✅ {d.fotoEntrega}</span>}
                                            </div>
                                            <div className="upload-group">
                                                <label>📄 Foto Remisión</label>
                                                <input type="file" onChange={(e) => handleProofUpload(d, 'fotoRemision', false, e.target.files?.[0] || null)} />
                                                {d.fotoRemision && <span className="upload-success">✅ {d.fotoRemision}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="empty-msg">No tiene entregas asignadas.</p>}
                        </div>

                        <div className="task-column">
                            <h4>🏭 Recogidas (Compras)</h4>
                            {assignedOCs.length > 0 ? assignedOCs.map(oc => (
                                <div key={oc.id} className={`task-card oc-task ${selectedTasks.includes(oc.id) ? 'selected-task' : ''}`}>
                                    <div className="task-main">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span className={`status-tag status-${oc.estado.toLowerCase().replace(' ', '-')}`}>{oc.estado}</span>
                                            <input
                                                type="checkbox"
                                                className="task-checkbox"
                                                checked={selectedTasks.includes(oc.id)}
                                                onChange={() => toggleTaskSelection(oc.id)}
                                            />
                                        </div>
                                        <p>{oc.nombreProveedor}</p>
                                        <strong>Recogida: {oc.consecutivo}</strong>
                                        <small>Cargar al proveedor asignado</small>
                                    </div>
                                    <div className="task-actions">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <button className="btn-geo" onClick={() => openMap(oc.nombreProveedor)} title="Mapa">📍 Localizar</button>
                                            <button
                                                className="btn-complete"
                                                onClick={() => markAsCompleted(oc, true)}
                                                disabled={oc.estado === 'Recogido'}
                                                style={{ backgroundColor: '#8b5cf6' }}
                                            >
                                                🏁 Recogido
                                            </button>
                                        </div>
                                        <div className="upload-grid">
                                            <div className="upload-group">
                                                <label>📸 Foto Recogida</label>
                                                <input type="file" onChange={(e) => handleProofUpload(oc, 'fotoEntrega', true, e.target.files?.[0] || null)} />
                                                {oc.fotoEntrega && <span className="upload-success">✅ {oc.fotoEntrega}</span>}
                                            </div>
                                            <div className="upload-group">
                                                <label>📄 Foto Remisión Prov.</label>
                                                <input type="file" onChange={(e) => handleProofUpload(oc, 'fotoRemision', true, e.target.files?.[0] || null)} />
                                                {oc.fotoRemision && <span className="upload-success">✅ {oc.fotoRemision}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="empty-msg">No tiene recogidas asignadas.</p>}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .form-group label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.25rem; }
                .file-input-wrapper { display: flex; flex-direction: column; gap: 0.25rem; }
                .file-input-wrapper input { font-size: 0.8rem; }
                .file-input-wrapper small { color: var(--primary-blue); font-size: 0.7rem; max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
                .doc-badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: bold; background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; }
                .doc-badge.active { background: var(--secondary-blue); color: var(--primary-blue); border-color: var(--primary-blue); }
                .btn-route { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; padding: 0.3rem 0.6rem; border-radius: 6px; cursor: pointer; }
                .btn-route:hover { background: #e0f2fe; }
                .route-header { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
                .route-title-group h3 { margin: 0; }
                .route-title-group p { margin: 0.2rem 0 0; font-size: 0.8rem; color: var(--text-muted); }
                .btn-optimize { background: var(--primary-blue); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                .btn-optimize:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .btn-optimize:disabled { background: #cbd5e1; cursor: not-allowed; }
                .task-checkbox { width: 1.2rem; height: 1.2rem; cursor: pointer; }
                .selected-task { border: 2px solid var(--primary-blue); background: #f0f7ff; }
                .btn-complete { background: #059669; color: white; border: none; padding: 0.5rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; }
                .btn-complete:disabled { background: #cbd5e1; cursor: not-allowed; }
                .upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
                .btn-geo { background: #3b82f6; }
                .upload-group label { display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.2rem; color: var(--text-muted); }
                .upload-group input { font-size: 0.75rem; width: 100%; }
                .upload-success { display: block; font-size: 0.7rem; color: #059669; font-weight: 600; margin-top: 0.1rem; }
                .empty-msg { text-align: center; color: var(--text-muted); padding: 2rem; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default ConductoresModule;
