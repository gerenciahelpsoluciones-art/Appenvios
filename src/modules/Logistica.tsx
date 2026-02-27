import React, { useState } from 'react';
import type { Despacho, OrdenCompra, Conductor } from '../App';

interface IProps {
    despachos: Despacho[];
    ordenesCompra: OrdenCompra[];
    conductores: Conductor[];
    onUpdateDespacho: (d: Despacho) => void;
    onDeleteDespacho: (id: string) => void;
    onUpdateOC: (oc: OrdenCompra) => void;
}

const LogisticaModule: React.FC<IProps> = ({
    despachos,
    ordenesCompra,
    conductores,
    onUpdateDespacho,
    onDeleteDespacho,
    onUpdateOC
}) => {
    const [activeTab, setActiveTab] = useState<'despachos' | 'recogidas'>('despachos');
    const [filterEstado, setFilterEstado] = useState<string>('Todos');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filter Logic
    const filteredDespachos = filterEstado === 'Todos'
        ? despachos
        : despachos.filter(d => d.estado === filterEstado);

    const filteredRecogidas = filterEstado === 'Todos'
        ? ordenesCompra
        : ordenesCompra.filter(oc => oc.estado === filterEstado);

    // Handlers
    const handleStatusChange = (d: Despacho, newStatus: Despacho['estado']) => {
        onUpdateDespacho({ ...d, estado: newStatus });
    };

    const handleOCStatusChange = (oc: OrdenCompra, newStatus: OrdenCompra['estado']) => {
        onUpdateOC({ ...oc, estado: newStatus });
    };

    const assignDriver = (d: Despacho, conductorId: string) => {
        const conductor = conductores.find(c => c.id === conductorId);
        onUpdateDespacho({
            ...d,
            conductorId: conductorId,
            conductorNombre: conductor?.nombre || ''
        });
    };

    const assignDriverOC = (oc: OrdenCompra, conductorId: string) => {
        const conductor = conductores.find(c => c.id === conductorId);
        onUpdateOC({
            ...oc,
            conductorId: conductorId,
            conductorNombre: conductor?.nombre || ''
        });
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const calculateSLA = (dateStr: string, estado: string) => {
        if (!dateStr) return { color: 'gray', days: 0 };
        // If already delivered/completed, we might want to stop counting or show final status
        // For now, let's show elapsed time for pending, and maybe a checkmark for completed
        if (estado === 'Entregado' || estado === 'En Bodega') {
            return { color: 'completed', days: 0 };
        }

        const requestDate = new Date(dateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - requestDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

        if (diffDays <= 2) return { color: 'green', days: diffDays };
        if (diffDays === 3) return { color: 'yellow', days: diffDays };
        return { color: 'red', days: diffDays };
    };

    return (
        <div className="module-container">
            <div className="module-header">
                <h2>Gestión de Logística</h2>
                <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <div className="tab-buttons">
                        <button
                            className={`btn-tab ${activeTab === 'despachos' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('despachos'); setFilterEstado('Todos'); }}
                        >
                            📦 Despachos (Ventas)
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'recogidas' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('recogidas'); setFilterEstado('Todos'); }}
                        >
                            🏭 Recogidas (Compras)
                        </button>
                    </div>
                    <select
                        className="input-field"
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        style={{ width: '180px' }}
                    >
                        <option value="Todos">Todos los estados</option>
                        {activeTab === 'despachos' ? (
                            <>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Preparando">Preparando</option>
                                <option value="Despachado">Despachado</option>
                                <option value="Entrega Parcial">Entrega Parcial</option>
                                <option value="Entregado">Entregado</option>
                            </>
                        ) : (
                            <>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Recogido">Recogido</option>
                                <option value="En Bodega">En Bodega</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {activeTab === 'despachos' ? (
                /* DESPACHOS VIEW */
                <div className="card table-card" style={{ marginTop: '1.5rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th style={{ minWidth: '120px' }}>Cotización</th>
                                    <th style={{ minWidth: '100px' }}>Fecha</th>
                                    <th style={{ width: '60px' }}>SLA</th>
                                    <th style={{ minWidth: '180px' }}>Cliente</th>
                                    <th style={{ minWidth: '200px' }}>Conductor</th>
                                    <th className="text-right" style={{ minWidth: '110px' }}>Monto</th>
                                    <th className="text-center" style={{ minWidth: '100px' }}>Pruebas</th>
                                    <th className="text-center" style={{ minWidth: '120px' }}>Estado</th>
                                    <th className="text-center" style={{ minWidth: '160px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDespachos.map((d) => (
                                    <React.Fragment key={d.id}>
                                        <tr className={expandedId === d.id ? 'row-expanded' : ''}>
                                            <td>
                                                <button className="btn-expand" onClick={() => toggleExpand(d.id)}>
                                                    {expandedId === d.id ? '▼' : '►'}
                                                </button>
                                            </td>
                                            <td><strong>{d.consecutivoCotizacion}</strong></td>
                                            <td>{d.fechaSolicitud}</td>
                                            <td className="text-center">
                                                {(() => {
                                                    const sla = calculateSLA(d.fechaSolicitud, d.estado);
                                                    if (sla.color === 'completed') return <span title="Completado">✔️</span>;
                                                    return (
                                                        <div className={`sla-indicator sla-${sla.color}`} title={`${sla.days} días transcurridos`}>
                                                            {sla.days}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td>{d.clienteNombre}</td>
                                            <td>
                                                <select
                                                    className="select-small"
                                                    value={d.conductorId || ''}
                                                    onChange={(e) => assignDriver(d, e.target.value)}
                                                >
                                                    <option value="">Asignar...</option>
                                                    {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                                </select>
                                            </td>
                                            <td className="text-right" style={{ fontWeight: 'bold' }}>
                                                ${d.total.toLocaleString()}
                                            </td>
                                            <td className="text-center">
                                                <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                                                    <span title="Foto Entrega" style={{ opacity: d.fotoEntrega ? 1 : 0.2 }}>📸</span>
                                                    <span title="Remisión" style={{ opacity: d.fotoRemision ? 1 : 0.2 }}>📄</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-badge status-${d.estado.toLowerCase().replace(' ', '-')}`}>
                                                    {d.estado}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="action-buttons">
                                                    <button className="btn-status" onClick={() => handleStatusChange(d, 'Preparando')} title="Preparando" disabled={d.estado === 'Preparando'}>📦</button>
                                                    <button className="btn-status" onClick={() => handleStatusChange(d, 'Despachado')} title="Despachado" disabled={d.estado === 'Despachado'}>🚚</button>
                                                    <button className="btn-status" onClick={() => handleStatusChange(d, 'Entrega Parcial')} title="Parcial" disabled={d.estado === 'Entrega Parcial'}>🌗</button>
                                                    <button className="btn-status" onClick={() => handleStatusChange(d, 'Entregado')} title="Entregado" disabled={d.estado === 'Entregado'}>✅</button>
                                                    <button className="btn-status" style={{ color: 'var(--error)' }} onClick={() => onDeleteDespacho(d.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === d.id && (
                                            <tr className="detail-row">
                                                <td colSpan={8}>
                                                    <div className="product-details-box animate-fade-in">
                                                        <h4>🔍 Detalles de Entrega: {d.direccion}</h4>
                                                        <table className="inner-table">
                                                            <thead>
                                                                <tr><th>Producto</th><th>N° Parte</th><th className="text-right">Cantidad</th></tr>
                                                            </thead>
                                                            <tbody>
                                                                {d.items.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>{item.nombreProducto}</td>
                                                                        <td><code>{item.numPart}</code></td>
                                                                        <td className="text-right">{item.cantidad}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* RECOGIDAS VIEW */
                <div className="card table-card" style={{ marginTop: '1.5rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th style={{ minWidth: '120px' }}>Orden Compra</th>
                                    <th style={{ minWidth: '100px' }}>Fecha</th>
                                    <th style={{ width: '60px' }}>SLA</th>
                                    <th style={{ minWidth: '180px' }}>Proveedor</th>
                                    <th style={{ minWidth: '200px' }}>Conductor</th>
                                    <th className="text-right" style={{ minWidth: '110px' }}>Total</th>
                                    <th className="text-center" style={{ minWidth: '100px' }}>Pruebas</th>
                                    <th className="text-center" style={{ minWidth: '120px' }}>Estado</th>
                                    <th className="text-center" style={{ minWidth: '160px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecogidas.map((oc) => (
                                    <React.Fragment key={oc.id}>
                                        <tr className={expandedId === oc.id ? 'row-expanded' : ''}>
                                            <td>
                                                <button className="btn-expand" onClick={() => toggleExpand(oc.id)}>
                                                    {expandedId === oc.id ? '▼' : '►'}
                                                </button>
                                            </td>
                                            <td><strong>{oc.consecutivo}</strong></td>
                                            <td>{oc.fecha}</td>
                                            <td className="text-center">
                                                {(() => {
                                                    const sla = calculateSLA(oc.fecha, oc.estado || 'Pendiente');
                                                    if (sla.color === 'completed') return <span title="Completado">✔️</span>;
                                                    return (
                                                        <div className={`sla-indicator sla-${sla.color}`} title={`${sla.days} días transcurridos`}>
                                                            {sla.days}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td>{oc.nombreProveedor}</td>
                                            <td>
                                                <select
                                                    className="select-small"
                                                    value={oc.conductorId || ''}
                                                    onChange={(e) => assignDriverOC(oc, e.target.value)}
                                                >
                                                    <option value="">Asignar...</option>
                                                    {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                                </select>
                                            </td>
                                            <td className="text-right" style={{ fontWeight: 'bold' }}>
                                                ${oc.total.toLocaleString()}
                                            </td>
                                            <td className="text-center">
                                                <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                                                    <span title="Foto Recogida" style={{ opacity: oc.fotoEntrega ? 1 : 0.2 }}>📸</span>
                                                    <span title="Remisión Prov" style={{ opacity: oc.fotoRemision ? 1 : 0.2 }}>📄</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-badge status-${(oc.estado || 'Pendiente').toLowerCase().replace(' ', '-')}`}>
                                                    {oc.estado || 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="action-buttons">
                                                    <button className="btn-status" onClick={() => handleOCStatusChange(oc, 'Recogido')} title="Recogido" disabled={oc.estado === 'Recogido'}>🚚</button>
                                                    <button className="btn-status" onClick={() => handleOCStatusChange(oc, 'En Bodega')} title="En Bodega" disabled={oc.estado === 'En Bodega'}>🏢</button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === oc.id && (
                                            <tr className="detail-row">
                                                <td colSpan={8}>
                                                    <div className="product-details-box animate-fade-in">
                                                        <h4>🔍 Items a Recoger</h4>
                                                        <table className="inner-table">
                                                            <thead>
                                                                <tr><th>Producto</th><th>N° Parte</th><th className="text-right">Cantidad</th></tr>
                                                            </thead>
                                                            <tbody>
                                                                {oc.items.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>{item.nombreProducto}</td>
                                                                        <td><code>{item.numPart}</code></td>
                                                                        <td className="text-right">{item.cantidad}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style>{`
                .btn-tab {
                    padding: 0.6rem 1.2rem;
                    border: 1px solid var(--border-color);
                    background: white;
                    cursor: pointer;
                    font-weight: 600;
                    color: var(--text-muted);
                    transition: all 0.2s;
                }
                .btn-tab:first-child { border-radius: 8px 0 0 8px; }
                .btn-tab:last-child { border-radius: 0 8px 8px 0; border-left: none; }
                .btn-tab.active {
                    background: var(--primary-blue);
                    color: white;
                    border-color: var(--primary-blue);
                }
                .select-small {
                    width: 100%;
                    padding: 4px;
                    border-radius: 4px;
                    border: 1px solid var(--border-color);
                    font-size: 0.85rem;
                }
                .btn-expand {
                    background: none; border: none; cursor: pointer; color: var(--primary-blue);
                }
                .row-expanded { background-color: #f1f5f9; }
                .detail-row td { padding: 0 !important; }
                .product-details-box {
                    padding: 1.5rem 3rem; border-left: 4px solid var(--primary-blue); background: #f8fafc;
                }
                .inner-table {
                    width: 100%; max-width: 800px; border-collapse: collapse; font-size: 0.9rem;
                    background: white; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden;
                }
                .inner-table th { background: #f1f5f9; padding: 10px 15px; text-align: left; }
                .inner-table td { padding: 10px 15px; border-bottom: 1px solid #f1f5f9; }
                
                .status-badge {
                    padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                }
                .status-pendiente { background: #fef3c7; color: #92400e; }
                .status-preparando { background: #dbeafe; color: #1e40af; }
                .status-despachado { background: #e0e7ff; color: #3730a3; }
                .status-entrega-parcial { background: #ffedd5; color: #9a3412; }
                .status-entregado { background: #d1fae5; color: #065f46; }
                .status-recogido { background: #e0e7ff; color: #3730a3; }
                .status-en-bodega { background: #dcfce7; color: #166534; }

                .action-buttons { display: flex; gap: 0.25rem; justify-content: center; }
                .btn-status {
                    border: 1px solid var(--border-color); background: white; cursor: pointer; padding: 0.4rem;
                    border-radius: 6px; font-size: 1rem;
                }
                .btn-status:hover:not(:disabled) { background: #f1f5f9; border-color: var(--primary-blue); }

                .sla-indicator {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: white;
                }
                .sla-green { background-color: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
                .sla-yellow { background-color: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.4); }
                .sla-red { background-color: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }

                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default LogisticaModule;
