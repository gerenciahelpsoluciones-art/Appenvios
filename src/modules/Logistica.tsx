import React, { useState } from 'react';
import type { Despacho, OrdenCompra, Conductor, Proveedor, Producto, AppUser, Devolucion, DevolucionItem, Cotizacion } from '../App';

interface IProps {
    cotizaciones: Cotizacion[];
    despachos: Despacho[];
    ordenesCompra: OrdenCompra[];
    devoluciones: Devolucion[];
    conductores: Conductor[];
    proveedores: Proveedor[];
    productos: Producto[];
    currentUser: AppUser;
    onUpdateDespacho: (d: Despacho) => void;
    onDeleteDespacho: (id: string) => void;
    onUpdateOC: (oc: OrdenCompra) => Promise<boolean | void>;
    onAddOC: (oc: OrdenCompra) => Promise<boolean | void>;
    onAddDevolucion: (d: Devolucion) => Promise<boolean>;
    onUpdateDevolucion: (d: Devolucion) => Promise<void>;
    onDeleteDevolucion: (id: string) => Promise<void>;
}

const LogisticaModule: React.FC<IProps> = ({
    cotizaciones,
    despachos,
    ordenesCompra,
    devoluciones,
    conductores,
    proveedores,
    productos,
    currentUser,
    onUpdateDespacho,
    onDeleteDespacho,
    onUpdateOC,
    onAddOC,
    onAddDevolucion,
    onUpdateDevolucion,
    onDeleteDevolucion
}) => {
    const [activeTab, setActiveTab] = useState<'despachos' | 'recogidas' | 'devoluciones'>('despachos');
    const [filterEstado, setFilterEstado] = useState<string>('Todos');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Manual Modal State
    const [isAddManualOpen, setIsAddManualOpen] = useState(false);
    const [selectedProvId, setSelectedProvId] = useState('');
    const [manualItems, setManualItems] = useState<DevolucionItem[]>([]);
    const [obs, setObs] = useState('');

    // Manual Item Entry
    const [selProdId, setSelProdId] = useState('');
    const [selCant, setSelCant] = useState(1);

    // Sort by date (newest first)
    const sortedDespachos = [...despachos].sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());
    const sortedOC = [...ordenesCompra].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const sortedDevoluciones = [...devoluciones].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Filter Logic
    const filteredDespachos = filterEstado === 'Todos'
        ? sortedDespachos
        : sortedDespachos.filter(d => d.estado === filterEstado);

    const filteredRecogidas = filterEstado === 'Todos'
        ? sortedOC.filter(oc => oc.tipo === 'Recogida')
        : sortedOC.filter(oc => oc.estado === filterEstado && oc.tipo === 'Recogida');

    const filteredDevoluciones = filterEstado === 'Todos'
        ? sortedDevoluciones
        : sortedDevoluciones.filter(d => d.estado === filterEstado);

    // Handlers
    const downloadFile = (url: string, _fileName: string) => {
        if (!url) {
            alert('No hay archivo disponible para descargar.');
            return;
        }

        // If it's a full URL (from Supabase Storage), open in new tab
        if (url.startsWith('http://') || url.startsWith('https://')) {
            window.open(url, '_blank');
        } else {
            // Legacy: just a filename, show a message
            alert(`El archivo "${url}" fue registrado pero no se subió al almacenamiento. Solicite al conductor que lo reenvíe.`);
        }
    };

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

    const assignDriverDevolucion = (d: Devolucion, conductorId: string) => {
        const conductor = conductores.find(c => c.id === conductorId);
        onUpdateDevolucion({
            ...d,
            conductorId: conductorId,
            conductorNombre: conductor?.nombre || ''
        });
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleAddManualItem = () => {
        const prod = productos.find(p => p.id === selProdId);
        if (prod && selCant > 0) {
            setManualItems([...manualItems, {
                id: crypto.randomUUID(),
                productoId: prod.id,
                nombreProducto: prod.nombre,
                numPart: prod.numPart,
                serial: '', // Will be used for returns
                cantidad: selCant
            }]);
            setSelProdId('');
            setSelCant(1);
        }
    };

    const handleSaveManualRecogida = async () => {
        const prov = proveedores.find(p => p.id === selectedProvId);
        if (!prov || manualItems.length === 0) {
            alert('Seleccione un proveedor y añada al menos un producto');
            return;
        }

        const newRecogida: OrdenCompra = {
            id: crypto.randomUUID(),
            consecutivo: `REC-M-${(ordenesCompra.length + 1).toString().padStart(4, '0')}`,
            fecha: new Date().toISOString().split('T')[0],
            proveedorId: prov.id,
            nombreProveedor: prov.nombre,
            items: manualItems.map(item => ({
                id: crypto.randomUUID(),
                productoId: item.productoId,
                nombreProducto: item.nombreProducto,
                numPart: item.numPart,
                cantidad: item.cantidad,
                precioUnitario: 0
            })),
            subtotal: 0,
            iva: 0,
            total: 0,
            condicionesComerciales: 'Recogida Manual',
            observaciones: obs,
            estado: 'Pendiente',
            usuarioId: currentUser.id,
            tipo: 'Recogida',
            verificada: false
        };

        const success = await onAddOC(newRecogida);
        if (success === false) return; // DB Error

        setObs('');
    };

    const handleSaveManualDevolucion = async () => {
        const prov = proveedores.find(p => p.id === selectedProvId);
        if (!prov || manualItems.length === 0) {
            alert('Seleccione un proveedor y añada al menos un producto');
            return;
        }

        const newDevolucion: Devolucion = {
            id: crypto.randomUUID(),
            consecutivo: `DEV-M-${(devoluciones.length + 1).toString().padStart(4, '0')}`,
            fecha: new Date().toISOString().split('T')[0],
            proveedorId: prov.id,
            nombreProveedor: prov.nombre,
            items: manualItems.map(item => ({
                id: item.id,
                productoId: item.productoId,
                nombreProducto: item.nombreProducto,
                numPart: item.numPart,
                serial: item.serial,
                cantidad: item.cantidad
            })),
            observaciones: obs,
            estado: 'Pendiente',
            usuarioId: currentUser.id
        };

        const success = await onAddDevolucion(newDevolucion);
        if (success === false) return;

        setIsAddManualOpen(false);
        setSelectedProvId('');
        setManualItems([]);
        setObs('');
    };

    const handleDevolutionStatusChange = (d: Devolucion, newStatus: Devolucion['estado']) => {
        onUpdateDevolucion({ ...d, estado: newStatus });
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
                        <button
                            className={`btn-tab ${activeTab === 'devoluciones' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('devoluciones'); setFilterEstado('Todos'); }}
                        >
                            🔄 Devoluciones
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
                        ) : activeTab === 'recogidas' ? (
                            <>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Recogido">Recogido</option>
                                <option value="En Bodega">En Bodega</option>
                            </>
                        ) : (
                            <>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Enviado">Enviado</option>
                                <option value="Completado">Completado</option>
                                <option value="Anulado">Anulado</option>
                            </>
                        )}
                    </select>
                    {activeTab === 'recogidas' && (
                        <button className="btn btn-primary" onClick={() => { setIsAddManualOpen(true); setManualItems([]); setSelectedProvId(''); setObs(''); }}>
                            + Nueva Recogida Manual
                        </button>
                    )}
                    {activeTab === 'devoluciones' && (
                        <button className="btn btn-primary" onClick={() => { setIsAddManualOpen(true); setManualItems([]); setSelectedProvId(''); setObs(''); }}>
                            + Nueva Devolución Manual
                        </button>
                    )}
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
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                    {(() => {
                                                        const cot = cotizaciones.find(c => c.id === d.cotizacionId);
                                                        return cot?.ordenCompraCliente ? (
                                                            <button
                                                                className="btn-download"
                                                                onClick={() => window.open(cot.ordenCompraCliente, '_blank')}
                                                                title="Ver Orden de Compra (OC) Cliente"
                                                            >📋</button>
                                                        ) : <span style={{ opacity: 0.2 }} title="Sin Orden de Compra">📋</span>;
                                                    })()}

                                                    {d.fotoEntrega ? (
                                                        <button
                                                            className="btn-download"
                                                            onClick={() => downloadFile(d.fotoEntrega!, `Entrega_${d.consecutivoCotizacion}.jpg`)}
                                                            title="Descargar Foto Entrega"
                                                        >📸</button>
                                                    ) : <span style={{ opacity: 0.2 }}>📸</span>}

                                                    {d.fotoRemision ? (
                                                        <button
                                                            className="btn-download"
                                                            onClick={() => downloadFile(d.fotoRemision!, `Remision_${d.consecutivoCotizacion}.pdf`)}
                                                            title="Descargar Remisión"
                                                        >📄</button>
                                                    ) : <span style={{ opacity: 0.2 }}>📄</span>}
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
                                                <td colSpan={10}>
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
            ) : activeTab === 'recogidas' ? (
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
                                    <th className="text-center" style={{ minWidth: '100px' }}>Verif</th>
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
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                    {oc.fotoEntrega ? (
                                                        <button
                                                            className="btn-download"
                                                            onClick={() => downloadFile(oc.fotoEntrega!, `Recogida_${oc.consecutivo}.jpg`)}
                                                            title="Descargar Foto"
                                                        >📸</button>
                                                    ) : <span style={{ opacity: 0.2 }}>📸</span>}

                                                    {oc.fotoRemision ? (
                                                        <button
                                                            className="btn-download"
                                                            onClick={() => downloadFile(oc.fotoRemision!, `Remision_${oc.consecutivo}.pdf`)}
                                                            title="Descargar Remisión Prov"
                                                        >📄</button>
                                                    ) : <span style={{ opacity: 0.2 }}>📄</span>}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {oc.verificada ? (
                                                    <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem' }} title="OC Verificada">🛡️</span>
                                                ) : (
                                                    <span style={{ opacity: 0.2 }} title="Sin Verificar">🛡️</span>
                                                )}
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
                                                <td colSpan={11}>
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
            ) : (
                /* DEVOLUCIONES VIEW */
                <div className="card table-card" style={{ marginTop: '1.5rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th style={{ minWidth: '120px' }}>Consecutivo</th>
                                    <th style={{ minWidth: '100px' }}>Fecha</th>
                                    <th style={{ minWidth: '180px' }}>Proveedor</th>
                                    <th className="text-center" style={{ minWidth: '120px' }}>Estado</th>
                                    <th className="text-center" style={{ minWidth: '160px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDevoluciones.map((d) => (
                                    <React.Fragment key={d.id}>
                                        <tr className={expandedId === d.id ? 'row-expanded' : ''}>
                                            <td>
                                                <button className="btn-expand" onClick={() => toggleExpand(d.id)}>
                                                    {expandedId === d.id ? '▼' : '►'}
                                                </button>
                                            </td>
                                            <td><strong>{d.consecutivo}</strong></td>
                                            <td>{d.fecha}</td>
                                            <td>{d.nombreProveedor}</td>
                                            <td>
                                                <select
                                                    className="select-small"
                                                    value={d.conductorId || ''}
                                                    onChange={(e) => assignDriverDevolucion(d, e.target.value)}
                                                >
                                                    <option value="">Asignar Conductor</option>
                                                    {conductores.map(c => (
                                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-badge status-${d.estado.toLowerCase()}`}>
                                                    {d.estado}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div className="action-buttons">
                                                    <button className="btn-status" onClick={() => handleDevolutionStatusChange(d, 'Enviado')} title="Marcar como Enviado" disabled={d.estado === 'Enviado'}>📤</button>
                                                    <button className="btn-status" onClick={() => handleDevolutionStatusChange(d, 'Completado')} title="Marcar como Completado" disabled={d.estado === 'Completado'}>✅</button>
                                                    <button className="btn-status" style={{ color: 'var(--error)' }} onClick={() => onDeleteDevolucion(d.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === d.id && (
                                            <tr className="detail-row">
                                                <td colSpan={6}>
                                                    <div className="product-details-box animate-fade-in">
                                                        <h4>🔍 Items a Devolver</h4>
                                                        <table className="inner-table">
                                                            <thead>
                                                                <tr><th>Producto</th><th>Serial</th><th className="text-right">Cantidad</th></tr>
                                                            </thead>
                                                            <tbody>
                                                                {d.items.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>{item.nombreProducto} (<code>{item.numPart}</code>)</td>
                                                                        <td><code>{item.serial || 'N/A'}</code></td>
                                                                        <td className="text-right">{item.cantidad}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        {d.observaciones && (
                                                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                                                <strong>Observaciones:</strong><br />
                                                                {d.observaciones}
                                                            </div>
                                                        )}
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

            {/* MANUAL MODAL */}
            {isAddManualOpen && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '850px', width: '95%' }}>
                        <h3>{activeTab === 'devoluciones' ? 'Nueva Devolución Manual' : 'Nueva Recogida Manual'}</h3>
                        <div className="form-grid-modern">
                            <div className="form-group">
                                <label>Proveedor</label>
                                <select
                                    className="input-field"
                                    value={selectedProvId}
                                    onChange={e => setSelectedProvId(e.target.value)}
                                >
                                    <option value="">-- Seleccionar Proveedor --</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>

                            <div className="item-entry-box card" style={{ background: '#f1f5f9', padding: '1rem', marginTop: '1rem' }}>
                                <h4>Añadir Productos</h4>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ flex: 3 }}>
                                        <label>Producto</label>
                                        <select
                                            className="input-field"
                                            value={selProdId}
                                            onChange={e => setSelProdId(e.target.value)}
                                        >
                                            <option value="">-- Seleccionar Producto --</option>
                                            {productos.map(p => <option key={p.id} value={p.id}>[{p.numPart}] {p.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Cant</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={selCant}
                                            onChange={e => setSelCant(Number(e.target.value))}
                                        />
                                    </div>
                                    <button className="btn btn-success" onClick={handleAddManualItem} style={{ height: '42px' }}>Añadir</button>
                                </div>
                            </div>

                            <table className="inner-table" style={{ width: '100%', marginTop: '1rem' }}>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        {activeTab === 'devoluciones' && <th>Serial</th>}
                                        <th>Cant</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {manualItems.map((item, i) => (
                                        <tr key={item.id}>
                                            <td>{item.nombreProducto} ({item.numPart})</td>
                                            {activeTab === 'devoluciones' && (
                                                <td>
                                                    <input
                                                        className="select-small"
                                                        value={item.serial}
                                                        onChange={e => {
                                                            const newItems = [...manualItems];
                                                            newItems[i].serial = e.target.value;
                                                            setManualItems(newItems);
                                                        }}
                                                        placeholder="N° Serial"
                                                    />
                                                </td>
                                            )}
                                            <td>{item.cantidad}</td>
                                            <td>
                                                <button className="btn-delete-icon" onClick={() => setManualItems(manualItems.filter((_, idx) => idx !== i))}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Observaciones</label>
                                <textarea
                                    className="input-field"
                                    value={obs}
                                    onChange={e => setObs(e.target.value)}
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setIsAddManualOpen(false)}>Cancelar</button>
                            {activeTab === 'devoluciones' ? (
                                <button className="btn-primary" onClick={handleSaveManualDevolucion}>Crear Devolución</button>
                            ) : (
                                <button className="btn-primary" onClick={handleSaveManualRecogida}>Crear Recogida</button>
                            )}
                        </div>
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
                
                .btn-download {
                    background: none;
                    border: 1px solid #e2e8f0;
                    cursor: pointer;
                    padding: 2px 5px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .btn-download:hover {
                    background: #f1f5f9;
                    border-color: var(--primary-blue);
                    transform: scale(1.1);
                }

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

                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .modal-content { max-height: 90vh; overflow-y: auto; }
            `}</style>
        </div>
    );
};

export default LogisticaModule;
