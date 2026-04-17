import React, { useState } from 'react';
import {
    type Despacho,
    type OrdenCompra,
    type Conductor,
    type Proveedor,
    type Producto,
    type AppUser,
    type Devolucion,
    type DevolucionItem,
    type Reparacion,
    type Cliente,
    type Cotizacion
} from '../types/crm';
import RemisionesModule from './Remisiones';

interface IProps {
    despachos: Despacho[];
    ordenesCompra: OrdenCompra[];
    devoluciones: Devolucion[];
    conductores: Conductor[];
    proveedores: Proveedor[];
    clientes: Cliente[];
    productos: Producto[];
    currentUser: AppUser | null;
    users: AppUser[];
    onUpdateDespacho: (d: Despacho) => void;
    onDeleteDespacho: (id: string) => void;
    onUpdateOC: (oc: OrdenCompra) => void;
    onAddOC: (oc: OrdenCompra) => Promise<OrdenCompra | null>;
    onAddDevolucion: (dev: Devolucion) => any;
    onUpdateDevolucion: (dev: Devolucion) => any;
    onDeleteDevolucion: (id: string) => any;
    reparaciones: Reparacion[];
    onDeleteOC: (id: string) => void;
    onUpdateReparacion: (r: Reparacion) => any;
    cotizaciones: Cotizacion[];
}

const LogisticaModule: React.FC<IProps> = ({
    despachos,
    ordenesCompra,
    devoluciones,
    conductores,
    proveedores,
    clientes,
    productos,
    currentUser,
    users,
    onUpdateDespacho,
    onDeleteDespacho,
    onUpdateOC,
    onDeleteOC,
    onAddOC,
    onAddDevolucion,
    onUpdateDevolucion,
    onDeleteDevolucion,
    reparaciones,
    onUpdateReparacion,
    cotizaciones
}) => {
    const [activeTab, setActiveTab] = useState<'despachos' | 'recogidas' | 'devoluciones' | 'reparaciones' | 'remisiones' | 'informes'>('despachos');
    const [filterEstado, setFilterEstado] = useState<string>('Todos');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'resumen' | 'tiempos'>('resumen');

    // Dashboard Filters
    const [dateStart, setDateStart] = useState<string>(() => {
        const d = new Date();
        d.setDate(1); // Default to start of month
        return d.toISOString().split('T')[0];
    });
    const [dateEnd, setDateEnd] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedUser, setSelectedUser] = useState<string>('Todos');

    // Manual Modal State
    const [isAddManualOpen, setIsAddManualOpen] = useState(false);
    const [recogidaTipoOrigen, setRecogidaTipoOrigen] = useState<'Proveedor' | 'Cliente'>('Proveedor');
    const [selectedProvId, setSelectedProvId] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [manualItems, setManualItems] = useState<DevolucionItem[]>([]);
    const [selProdId, setSelProdId] = useState('');
    const [selCant, setSelCant] = useState(1);
    const [obs, setObs] = useState('');

    const sortedDespachos = [...despachos].sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());
    const sortedOC = [...ordenesCompra].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const sortedDevoluciones = [...devoluciones].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const sortedReparaciones = [...(reparaciones || [])]
        .filter(r => r.tipoServicio === 'Proveedor')
        .sort((a, b) => new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime());

    // Filter Logic
    const isFinished = (status: string) => ['Entregado', 'Recibido', 'Completado', 'Rechazado'].includes(status);
    
    function filterByDateAndStatus<T>(items: T[], dateField: keyof T): T[] {
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        end.setHours(23, 59, 59, 999);

        return items.filter(item => {
            const itemDate = new Date(item[dateField] as unknown as string);
            const inRange = itemDate >= start && itemDate <= end;
            const pending = !isFinished((item as any).estado);
            return inRange || pending;
        });
    }

    const filteredDespachos = filterByDateAndStatus(
        filterEstado === 'Todos' ? sortedDespachos : sortedDespachos.filter(d => d.estado === filterEstado),
        'fechaSolicitud'
    );

    const filteredRecogidas = filterByDateAndStatus(
        filterEstado === 'Todos' ? sortedOC : sortedOC.filter(oc => oc.estado === filterEstado),
        'fecha'
    );

    const filteredDevoluciones = filterByDateAndStatus(
        filterEstado === 'Todos' ? sortedDevoluciones : sortedDevoluciones.filter(d => d.estado === filterEstado),
        'fecha'
    );

    const filteredReparaciones = filterByDateAndStatus(
        filterEstado === 'Todos' ? sortedReparaciones : sortedReparaciones.filter(r => r.estado === filterEstado),
        'fechaIngreso'
    );

    const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

    const handleStatusChange = (d: Despacho, newStatus: string) => {
        onUpdateDespacho({ ...d, estado: newStatus as any });
    };

    const assignDriver = (d: Despacho, driverId: string) => {
        onUpdateDespacho({ ...d, conductorId: driverId });
    };

    const handleOCStatusChange = (oc: OrdenCompra, newStatus: string) => {
        onUpdateOC({ ...oc, estado: newStatus as any });
    };

    const assignDriverOC = (oc: OrdenCompra, driverId: string) => {
        onUpdateOC({ ...oc, conductorId: driverId });
    };

    const handleDevolutionStatusChange = async (d: Devolucion, newStatus: string) => {
        await onUpdateDevolucion({ ...d, estado: newStatus as any });
    };

    const assignDriverDevolucion = async (d: Devolucion, driverId: string) => {
        await onUpdateDevolucion({ ...d, conductorId: driverId });
    };

    const handleReparacionStatusChange = (r: Reparacion, newStatus: string) => {
        onUpdateReparacion({ ...r, estado: newStatus as any });
    };

    const assignDriverReparacion = (r: Reparacion, driverId: string) => {
        onUpdateReparacion({ ...r, conductorId: driverId });
    };

    const downloadFile = (url: string, filename: string) => {
        // Favoring browser's native PDF viewer over forced download
        if (url.toLowerCase().endsWith('.pdf')) {
            window.open(url, '_blank', 'noreferrer');
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleAddManualItem = () => {
        if (!selProdId) return;
        const p = productos.find(x => x.id === selProdId);
        if (!p) return;
        const newItem: DevolucionItem = {
            id: crypto.randomUUID(),
            productoId: p.id,
            nombreProducto: p.nombre,
            numPart: p.numPart,
            cantidad: selCant,
            serial: ''
        };
        setManualItems([...manualItems, newItem]);
        setSelProdId('');
        setSelCant(1);
    };

    const handleSaveManualRecogida = async () => {
        if (recogidaTipoOrigen === 'Proveedor' && !selectedProvId) {
            alert("Seleccione un proveedor e items.");
            return;
        }
        if (recogidaTipoOrigen === 'Cliente' && !selectedClientId) {
            alert("Seleccione un cliente e items.");
            return;
        }
        if (manualItems.length === 0) {
            alert("Debe agregar al menos un ítem.");
            return;
        }

        let origenId = '';
        let origenNombre = '';

        if (recogidaTipoOrigen === 'Proveedor') {
            const prov = proveedores.find(p => p.id === selectedProvId);
            origenId = selectedProvId;
            origenNombre = prov?.nombre || 'PROV MANUAL';
        } else {
            const cli = clientes.find(c => c.id === selectedClientId);
            origenId = selectedClientId;
            origenNombre = cli?.nombre || 'CLIENTE MANUAL';
        }

        const newOC: OrdenCompra = {
            id: crypto.randomUUID(),
            consecutivo: `REC-${Date.now().toString().slice(-6)}`,
            fecha: new Date().toISOString().split('T')[0],
            proveedorId: origenId,
            nombreProveedor: origenNombre,
            items: manualItems.map(mi => ({
                id: mi.id,
                productoId: mi.productoId,
                nombreProducto: mi.nombreProducto,
                numPart: mi.numPart,
                cantidad: mi.cantidad,
                precioUnitario: 0
            })),
            subtotal: 0,
            iva: 0,
            total: 0,
            condicionesComerciales: '',
            observaciones: '',
            estado: 'Pendiente',
            verificada: false,
            usuarioId: currentUser?.id || '',
            tipo: 'Recogida',
            moneda: 'COP',
            trm: 0
        };
        onAddOC(newOC);
        setIsAddManualOpen(false);
    };

    const handleSaveManualDevolucion = async () => {
        if (!selectedProvId || manualItems.length === 0) {
            alert("Seleccione proveedor e items.");
            return;
        }
        const prov = proveedores.find(p => p.id === selectedProvId);
        const newDev: Devolucion = {
            id: crypto.randomUUID(),
            consecutivo: `DEV-${Date.now().toString().slice(-6)}`,
            fecha: new Date().toISOString().split('T')[0],
            proveedorId: selectedProvId,
            nombreProveedor: prov?.nombre || 'PROV MANUAL',
            items: manualItems,
            estado: 'Pendiente',
            observaciones: obs,
            usuarioId: currentUser?.id || ''
        };
        await onAddDevolucion(newDev);
        setIsAddManualOpen(false);
    };

    const calculateSLA = (dateStr: string, status: string) => {
        if (status === 'Entregado' || status === 'En Bodega' || status === 'Completado' || status === 'Recogido') return { color: 'completed', days: 0 };
        const requestDate = new Date(dateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - requestDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

        if (diffDays <= 2) return { color: 'green', days: diffDays };
        if (diffDays === 3) return { color: 'yellow', days: diffDays };
        return { color: 'red', days: diffDays };
    };

    const renderInformes = () => {
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        end.setHours(23, 59, 59, 999);

        const filterDate = (dateStr: string) => {
            const d = new Date(dateStr);
            return d >= start && d <= end;
        };

        const filterUser = (uid: string) => selectedUser === 'Todos' || uid === selectedUser;

        const dCounts = despachos.filter(d => filterDate(d.fechaSolicitud) && filterUser(d.usuarioId));
        const ocCounts = ordenesCompra.filter(oc => filterDate(oc.fecha) && filterUser(oc.usuarioId));
        const devCounts = devoluciones.filter(d => filterDate(d.fecha) && filterUser(d.usuarioId));
        const repCounts = reparaciones.filter(r => filterDate(r.fechaIngreso));

        const ERICK_MONTHLY_COST = 2826213;

        // Group by user for the summary table
        const userSummary = users.map(u => {
            const uDespachos = despachos.filter(d => filterDate(d.fechaSolicitud) && d.usuarioId === u.id);
            const uRecogidas = ordenesCompra.filter(oc => filterDate(oc.fecha) && oc.usuarioId === u.id);
            const uDevoluciones = devoluciones.filter(d => filterDate(d.fecha) && d.usuarioId === u.id);
            
            const totalShipments = uDespachos.length + uRecogidas.length;
            const isErick = u.nombre.toLowerCase().includes('erick');
            
            const unitCost = (isErick && totalShipments > 0) ? Math.round(ERICK_MONTHLY_COST / totalShipments) : 0;
            const totalOperatingCost = isErick ? ERICK_MONTHLY_COST : 0;

            return {
                ...u,
                despachos: uDespachos.length,
                recogidas: uRecogidas.length,
                devoluciones: uDevoluciones.length,
                totalMonto: uDespachos.reduce((acc, d) => acc + d.total, 0) + uRecogidas.reduce((acc, oc) => acc + oc.total, 0),
                unitCost,
                totalOperatingCost,
                isErick
            };
        }).filter(u => (u.despachos + u.recogidas + u.devoluciones) > 0 || (selectedUser !== 'Todos' && u.id === selectedUser));

        // TIMELINE REPORT DATA
        const timelineData = despachos
            .filter(d => filterDate(d.fechaSolicitud) && filterUser(d.usuarioId))
            .map(d => {
                const quote = cotizaciones.find(q => q.id === d.cotizacionId);
                const orderDate = quote?.fecha || 'N/A';
                
                let diffDays = 0;
                if (quote?.fecha && d.fechaSolicitud) {
                    const start = new Date(quote.fecha);
                    const end = new Date(d.fechaSolicitud);
                    diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                }

                return {
                    ...d,
                    orderDate,
                    diffDays,
                    userName: users.find(u => u.id === d.usuarioId)?.nombre || 'N/A'
                };
            }).sort((a, b) => b.diffDays - a.diffDays);

        return (
            <div className="dashboard-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                    <button 
                        className={`btn ${viewMode === 'resumen' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('resumen')}
                        style={{ padding: '0.5rem 1.5rem', borderRadius: '20px' }}
                    >
                        📊 Resumen General
                    </button>
                    <button 
                        className={`btn ${viewMode === 'tiempos' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setViewMode('tiempos')}
                        style={{ padding: '0.5rem 1.5rem', borderRadius: '20px' }}
                    >
                        ⏱️ Tiempos de Entrega
                    </button>
                </div>

                {viewMode === 'resumen' ? (
                    <>
                        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderLeft: '6px solid var(--primary-blue)' }}>
                                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>DESPACHOS</span>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginTop: '0.5rem' }}>{dCounts.length}</div>
                            </div>
                            <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderLeft: '6px solid #f59e0b' }}>
                                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>RECOGIDAS</span>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginTop: '0.5rem' }}>{ocCounts.length}</div>
                            </div>
                            <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderLeft: '6px solid #ef4444' }}>
                                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>DEVOLUCIONES</span>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginTop: '0.5rem' }}>{devCounts.length}</div>
                            </div>
                            <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderLeft: '6px solid #8b5cf6' }}>
                                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>REPARACIONES EXT.</span>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginTop: '0.5rem' }}>{repCounts.length}</div>
                            </div>
                        </div>

                        <div className="card table-card">
                            <h3 style={{ padding: '1.25rem', margin: 0, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                👥 Resumen de Gestión por Usuario
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%', minWidth: '700px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: '200px' }}>Usuario</th>
                                            <th className="text-center" style={{ width: '120px' }}>Despachos</th>
                                            <th className="text-center" style={{ width: '120px' }}>Recogidas</th>
                                            <th className="text-center" style={{ width: '120px' }}>Devoluciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userSummary.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{u.nombre}</div>
                                                    <small style={{ color: '#64748b' }}>{u.cargo}</small>
                                                </td>
                                                <td className="text-center">{u.despachos}</td>
                                                <td className="text-center">{u.recogidas}</td>
                                                <td className="text-center">{u.devoluciones}</td>
                                            </tr>
                                        ))}
                                        {userSummary.length === 0 && (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                                    No hay actividad registrada en este periodo.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="card table-card animate-fade-in">
                        <h3 style={{ padding: '1.25rem', margin: 0, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            ⏱️ Reporte de Tiempos de Entrega (Línea de Tiempo)
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%', minWidth: '800px' }}>
                                <thead>
                                    <tr>
                                        <th>Cotización</th>
                                        <th>Asesor</th>
                                        <th className="text-center">Fecha Pedido</th>
                                        <th className="text-center">Solicitud Despacho</th>
                                        <th className="text-center">Días Transcurridos</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timelineData.map(d => (
                                        <tr key={d.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{d.consecutivoCotizacion}</div>
                                                <small style={{ color: '#64748b' }}>Referencia: {d.id.substring(0, 8)}</small>
                                            </td>
                                            <td>{d.userName}</td>
                                            <td className="text-center">{d.orderDate}</td>
                                            <td className="text-center">{d.fechaSolicitud}</td>
                                            <td className="text-center">
                                                <span className={`badge ${d.diffDays > 5 ? 'badge-danger' : d.diffDays > 2 ? 'badge-warning' : 'badge-success'}`} 
                                                      style={{ padding: '0.4rem 0.8rem', borderRadius: '12px', fontWeight: 'bold' }}>
                                                    {d.diffDays} {d.diffDays === 1 ? 'día' : 'días'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${d.estado.toLowerCase()}`} style={{ fontSize: '0.85rem' }}>
                                                    {d.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {timelineData.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                                No se encontraron despachos en el periodo seleccionado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '1rem', background: '#f8fafc', fontSize: '0.85rem', color: '#64748b', borderRadius: '0 0 12px 12px', borderTop: '1px solid #e2e8f0' }}>
                            💡 <strong>Tip:</strong> Los días transcurridos se calculan desde la fecha de creación de la cotización hasta la fecha en que se solicitó el despacho.
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const renderTabContent = () => {
        if (activeTab === 'informes') return renderInformes();
        if (activeTab === 'despachos') {
            const pending = filteredDespachos.filter(d => !['Despachado', 'Entregado', 'Entrega Parcial'].includes(d.estado));
            const completed = filteredDespachos.filter(d => ['Despachado', 'Entregado', 'Entrega Parcial'].includes(d.estado));

            const renderTable = (list: Despacho[], title: string, isCompleted: boolean) => (
                <div className="card table-card" style={{ marginTop: '1.5rem', opacity: isCompleted ? 0.9 : 1, border: isCompleted ? '1px dashed #cbd5e1' : 'none' }}>
                    <h3 style={{ padding: '1rem', margin: 0, color: isCompleted ? '#059669' : '#1e293b', borderBottom: '1px solid #e2e8f0', background: isCompleted ? '#f1f5f9' : 'transparent' }}>
                        {isCompleted ? '✅' : '📦'} {title} ({list.length})
                    </h3>
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
                                    <th className="text-center" style={{ minWidth: '110px' }}>OC Cliente</th>
                                    <th className="text-center" style={{ minWidth: '120px' }}>Estado</th>
                                    <th className="text-center" style={{ minWidth: '160px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((d) => {
                                    const linkedQuote = cotizaciones.find(q => q.id === d.cotizacionId) || 
                                                       cotizaciones.find(q => q.consecutivo === d.consecutivoCotizacion);
                                    const tieneOC = !!(linkedQuote?.ordenCompraCliente || linkedQuote?.ordenCompraUrl);
                                    return (
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
                                                    <option value="VIRTUAL">📧 Asignación Virtual</option>
                                                    <option value="TRANSPORTADORA_RECOGE">📦 Recoge transportadora</option>
                                                    <option value="TRANSPORTADORA_DESPACHO">🚚 Despacho transportadora</option>
                                                    {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                                </select>
                                            </td>
                                            <td className="text-right" style={{ fontWeight: 'bold' }}>
                                                ${d.total.toLocaleString()}
                                            </td>
                                            <td className="text-center">
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
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
                                                {linkedQuote ? (
                                                    tieneOC ? (
                                                        <span
                                                            title={`OC: ${linkedQuote.ordenCompraCliente || 'Archivo adjunto'}`}
                                                            style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                                background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.55rem',
                                                                borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700,
                                                                border: '1px solid #6ee7b7', cursor: 'default'
                                                            }}
                                                        >
                                                            📋 {linkedQuote.ordenCompraCliente || 'Ver OC'}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            title="Cotización ganada sin OC registrada"
                                                            style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                                background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.55rem',
                                                                borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600,
                                                                border: '1px solid #fcd34d', cursor: 'default'
                                                            }}
                                                        >
                                                            ⚠️ Sin OC
                                                        </span>
                                                    )
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>—</span>
                                                )}
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
                                                    <button className="btn-status" onClick={() => setActiveTab('remisiones')} title="Generar Remisión" style={{ color: '#2563eb' }}>📄</button>
                                                    <button className="btn-status" style={{ color: 'var(--error)' }} onClick={() => onDeleteDespacho(d.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === d.id && (
                                            <tr className="detail-row">
                                                <td colSpan={11}>
                                                    <div className="product-details-box animate-fade-in">
                                                        <h4>🔍 Detalles de Entrega: {d.direccion}</h4>
                                                        <table className="inner-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Producto a Despachar</th>
                                                                    <th>N° Parte</th>
                                                                    <th className="text-right">Cantidad</th>
                                                                </tr>
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

                                                        {/* SECCIÓN OC DEL CLIENTE */}
                                                        {linkedQuote && (
                                                            <div style={{ 
                                                                marginTop: '1.25rem', padding: '1.25rem', borderRadius: '12px',
                                                                background: tieneOC ? '#f0fdf4' : '#fffbeb',
                                                                border: `1px solid ${tieneOC ? '#b9f6ca' : '#fde68a'}`,
                                                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                        <span style={{ fontSize: '1.25rem' }}>📋</span>
                                                                        <h5 style={{ margin: 0, fontSize: '1rem', color: tieneOC ? '#166534' : '#92400e' }}>
                                                                            Orden de Compra del Cliente
                                                                        </h5>
                                                                    </div>
                                                                    
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                        {linkedQuote.ordenCompraCliente && (
                                                                            <span style={{ 
                                                                                background: '#dcfce7', color: '#15803d', padding: '0.35rem 0.85rem', 
                                                                                borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem', border: '1px solid #b9f6ca' 
                                                                            }}>
                                                                                N° {linkedQuote.ordenCompraCliente}
                                                                            </span>
                                                                        )}
                                                                        
                                                                        {linkedQuote.ordenCompraUrl ? (
                                                                            <a
                                                                                href={linkedQuote.ordenCompraUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                style={{
                                                                                    background: '#2563eb', color: 'white', padding: '0.5rem 1.25rem',
                                                                                    borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem',
                                                                                    textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                                                                                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
                                                                                }}
                                                                            >
                                                                                📥 ABRIR DOCUMENTO OC
                                                                            </a>
                                                                        ) : linkedQuote.ordenCompraCliente ? (
                                                                            <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.85rem', background: '#fee2e2', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                                                                                ⚠️ Falta archivo PDF (No adjunto)
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ color: '#92400e', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                                                                ⚠️ No se registró OC al cerrar
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                                {/* Comparación ítems cotizados vs ítems a despachar */}
                                                                {linkedQuote.items && linkedQuote.items.length > 0 && (
                                                                    <>
                                                                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                                                                            Ítems de la cotización (lo que pidió el cliente):
                                                                        </p>
                                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                                            <thead>
                                                                                <tr style={{ background: 'rgba(0,0,0,0.04)' }}>
                                                                                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Producto cotizado</th>
                                                                                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', borderBottom: '1px solid rgba(0,0,0,0.1)', width: '90px' }}>Cant. cot.</th>
                                                                                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'right', borderBottom: '1px solid rgba(0,0,0,0.1)', width: '90px' }}>Cant. desp.</th>
                                                                                    <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)', width: '80px' }}>Estado</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {linkedQuote.items.map((qItem, qIdx) => {
                                                                                    const prod = productos.find(p => p.id === qItem.productoId);
                                                                                    const prodNombre = prod?.nombre || `Producto ID: ${qItem.productoId.substring(0, 8)}`;
                                                                                    const matchDespacho = d.items.find(di =>
                                                                                        di.productoId === qItem.productoId ||
                                                                                        (prod && di.nombreProducto?.toLowerCase().trim() === prod.nombre?.toLowerCase().trim())
                                                                                    );
                                                                                    const cantDesp = matchDespacho?.cantidad;
                                                                                    const coincide = cantDesp !== undefined && cantDesp === qItem.cantidad;
                                                                                    const parcial = cantDesp !== undefined && cantDesp !== qItem.cantidad;
                                                                                    return (
                                                                                        <tr key={qIdx} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                                                                            <td style={{ padding: '0.4rem 0.6rem' }}>{prodNombre}</td>
                                                                                            <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', fontWeight: 600 }}>{qItem.cantidad}</td>
                                                                                            <td style={{ padding: '0.4rem 0.6rem', textAlign: 'right', color: cantDesp !== undefined ? '#1e293b' : '#94a3b8' }}>
                                                                                                {cantDesp ?? '—'}
                                                                                            </td>
                                                                                            <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>
                                                                                                {coincide ? (
                                                                                                    <span title="Coincide" style={{ color: '#16a34a', fontWeight: 700, fontSize: '1rem' }}>✅</span>
                                                                                                ) : parcial ? (
                                                                                                    <span title="Cantidad diferente" style={{ color: '#d97706', fontWeight: 700, fontSize: '1rem' }}>⚠️</span>
                                                                                                ) : (
                                                                                                    <span title="No incluido en despacho" style={{ color: '#dc2626', fontWeight: 700, fontSize: '1rem' }}>❌</span>
                                                                                                )}
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                                                                            ✅ Coincide &nbsp;|&nbsp; ⚠️ Cantidad diferente &nbsp;|&nbsp; ❌ No incluido en despacho
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {renderTable(pending, 'Pendientes de Despacho', false)}
                    {completed.length > 0 && renderTable(completed, 'Despachos Realizados / Finalizados', true)}
                </div>
            );
        } else if (activeTab === 'recogidas') {
            const pending = filteredRecogidas.filter(oc => !['Recogido', 'En Bodega'].includes(oc.estado || 'Pendiente'));
            const completed = filteredRecogidas.filter(oc => ['Recogido', 'En Bodega'].includes(oc.estado || 'Pendiente'));

            const renderRecogidaTable = (list: OrdenCompra[], title: string, isCompleted: boolean) => (
                <div className="card table-card" style={{ marginTop: '1.5rem', opacity: isCompleted ? 0.9 : 1, border: isCompleted ? '1px dashed #cbd5e1' : 'none' }}>
                    <h3 style={{ padding: '1rem', margin: 0, color: isCompleted ? '#059669' : '#1e293b', borderBottom: '1px solid #e2e8f0', background: isCompleted ? '#f1f5f9' : 'transparent' }}>
                        {isCompleted ? '✅' : '🏢'} {title} ({list.length})
                    </h3>
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
                                {list.map((oc) => (
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
                                                    <option value="VIRTUAL">📧 Asignación Virtual</option>
                                                    <option value="TRANSPORTADORA_RECOGE">📦 Recoge transportadora</option>
                                                    <option value="TRANSPORTADORA_DESPACHO">🚚 Despacho transportadora</option>
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
                                                    <button className="btn-status" style={{ color: 'var(--error)' }} onClick={() => { if(window.confirm('¿Eliminar esta recogida?')) onDeleteOC(oc.id) }} title="Eliminar">🗑️</button>
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
            );

            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {renderRecogidaTable(pending, 'Recogidas Pendientes', false)}
                    {completed.length > 0 && renderRecogidaTable(completed, 'Recogidas Realizadas / En Bodega', true)}
                </div>
            );
        } else if (activeTab === 'devoluciones') {
            // DEVOLUCIONES
            return (
                <div className="card table-card" style={{ marginTop: '1.5rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th style={{ minWidth: '120px' }}>Consecutivo</th>
                                    <th style={{ minWidth: '100px' }}>Fecha</th>
                                    <th style={{ minWidth: '180px' }}>Proveedor</th>
                                    <th className="text-center" style={{ minWidth: '120px' }}>Conductor</th>
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
                                            <td className="text-center">
                                                <select
                                                    className="select-small"
                                                    value={d.conductorId || ''}
                                                    onChange={(e) => assignDriverDevolucion(d, e.target.value)}
                                                >
                                                    <option value="">Asignar Conductor</option>
                                                    <option value="VIRTUAL">📧 Asignación Virtual</option>
                                                    <option value="TRANSPORTADORA_RECOGE">📦 Recoge transportadora</option>
                                                    <option value="TRANSPORTADORA_DESPACHO">🚚 Despacho transportadora</option>
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
                                                <td colSpan={7}>
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
            );
        } else if (activeTab === 'reparaciones') {
            // REPARACIONES EXTERNAS
            return (
                <div className="card table-card" style={{ marginTop: '1.5rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th style={{ minWidth: '120px' }}>Consecutivo</th>
                                    <th style={{ minWidth: '100px' }}>Fecha Ing.</th>
                                    <th style={{ minWidth: '150px' }}>Cliente</th>
                                    <th style={{ minWidth: '150px' }}>Equipo/Serial</th>
                                    <th style={{ minWidth: '150px' }}>Proveedor Ext.</th>
                                    <th className="text-center" style={{ minWidth: '150px' }}>Conductor</th>
                                    <th className="text-center" style={{ minWidth: '120px' }}>Estado</th>
                                    <th className="text-center" style={{ minWidth: '160px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReparaciones.map((r) => (
                                    <tr key={r.id}>
                                        <td></td>
                                        <td><strong>{r.consecutivo}</strong></td>
                                        <td>{r.fechaIngreso}</td>
                                        <td>{r.clienteNombre}</td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <strong>{r.tipo}</strong> {r.marca}<br />
                                                <code>{r.serial}</code>
                                            </div>
                                        </td>
                                        <td><strong>{r.proveedorNombre || 'N/A'}</strong></td>
                                        <td className="text-center">
                                            <select
                                                className="select-small"
                                                value={r.conductorId || ''}
                                                onChange={(e) => assignDriverReparacion(r, e.target.value)}
                                            >
                                                <option value="">Asignar...</option>
                                                <option value="VIRTUAL">📧 Asignación Virtual</option>
                                                <option value="TRANSPORTADORA_RECOGE">📦 Recoge transportadora</option>
                                                <option value="TRANSPORTADORA_DESPACHO">🚚 Despacho transportadora</option>
                                                {conductores.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="text-center">
                                            <span className={`status-badge status-${r.estado.toLowerCase().replace(/ /g, '-')}`}>
                                                {r.estado}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="action-buttons">
                                                <button className="btn-status" onClick={() => handleReparacionStatusChange(r, 'En Diagnóstico')} title="En Diagnóstico">🔍</button>
                                                <button className="btn-status" onClick={() => handleReparacionStatusChange(r, 'En Reparación')} title="En Reparación">⚙️</button>
                                                <button className="btn-status" onClick={() => handleReparacionStatusChange(r, 'Reparado')} title="Reparado">✅</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        } else if (activeTab === 'remisiones') {
            return (
                <div className="animate-fade-in" style={{ marginTop: '1.5rem' }}>
                    <RemisionesModule 
                        clientes={clientes} 
                        productos={productos} 
                        currentUser={currentUser} 
                    />
                </div>
            );
        }
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
                        <button
                            className={`btn-tab ${activeTab === 'reparaciones' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('reparaciones'); setFilterEstado('Todos'); }}
                        >
                            🛠️ Reparaciones Ext.
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'remisiones' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('remisiones'); setFilterEstado('Todos'); }}
                        >
                            📄 Remisiones
                        </button>
                        <button
                            className={`btn-tab ${activeTab === 'informes' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('informes'); }}
                        >
                            📊 Dashboard / Informes
                        </button>
                    </div>

                    {activeTab === 'informes' ? (
                        <div className="dashboard-filters" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Desde:</label>
                                <input type="date" className="input-field" value={dateStart} onChange={(e) => setDateStart(e.target.value)} style={{ width: '135px', padding: '0.4rem' }} />
                            </div>
                            <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Hasta:</label>
                                <input type="date" className="input-field" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} style={{ width: '135px', padding: '0.4rem' }} />
                            </div>
                            <select
                                className="input-field"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                style={{ width: '180px', padding: '0.4rem' }}
                            >
                                <option value="Todos">Todos los Usuarios</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                            </select>
                        </div>
                    ) : (
                        <select
                            className="input-field"
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                            style={{ width: '180px' }}
                        >
                            <option value="Todos">Todos los Estados</option>
                            {activeTab === 'despachos' && (
                                <>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Preparando">Preparando</option>
                                    <option value="Despachado">Despachado</option>
                                    <option value="Entrega Parcial">Entrega Parcial</option>
                                    <option value="Entregado">Entregado</option>
                                </>
                            )}
                            {activeTab === 'recogidas' && (
                                <>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Recogido">Recogido</option>
                                    <option value="En Bodega">En Bodega</option>
                                </>
                            )}
                            {activeTab === 'devoluciones' && (
                                <>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Enviado">Enviado</option>
                                    <option value="Completado">Completado</option>
                                </>
                            )}
                            {activeTab === 'reparaciones' && (
                                <>
                                    <option value="Recibido">Recibido</option>
                                    <option value="En Diagnóstico">En Diagnóstico</option>
                                    <option value="En Reparación">En Reparación</option>
                                    <option value="Esperando Repuestos">Esperando Repuestos</option>
                                    <option value="Reparado">Reparado</option>
                                    <option value="Entregado">Entregado</option>
                                    <option value="Cerrado">Cerrado</option>
                                </>
                            )}
                        </select>
                    )}

                    {activeTab === 'recogidas' && (
                        <button className="btn btn-primary" onClick={() => {
                            setIsAddManualOpen(true);
                            setManualItems([]);
                            setSelectedProvId('');
                            setSelectedClientId('');
                            setRecogidaTipoOrigen('Proveedor');
                            setSelProdId('');
                            setSelCant(1);
                        }}>
                            + Recogida Manual
                        </button>
                    )}
                    {activeTab === 'devoluciones' && (
                        <button className="btn btn-primary" onClick={() => { setIsAddManualOpen(true); setManualItems([]); setSelectedProvId(''); setObs(''); }}>
                            + Nueva Devolución Manual
                        </button>
                    )}
                </div>
            </div>

            {renderTabContent()}

            {/* MANUAL MODAL */}
            {isAddManualOpen && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '850px', width: '95%' }}>
                        <h3>{activeTab === 'devoluciones' ? 'Nueva Devolución Manual' : 'Nueva Recogida Manual'}</h3>
                        <div className="form-grid-modern">
                            {activeTab === 'recogidas' && (
                                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: '1rem' }}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Tipo de Origen</label>
                                    <div style={{ display: 'flex', gap: '1.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                                            <input
                                                type="radio"
                                                name="tipoOrigen"
                                                value="Proveedor"
                                                checked={recogidaTipoOrigen === 'Proveedor'}
                                                onChange={() => setRecogidaTipoOrigen('Proveedor')}
                                            />
                                            🏭 Proveedor
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                                            <input
                                                type="radio"
                                                name="tipoOrigen"
                                                value="Cliente"
                                                checked={recogidaTipoOrigen === 'Cliente'}
                                                onChange={() => setRecogidaTipoOrigen('Cliente')}
                                            />
                                            🏢 Cliente
                                        </label>
                                    </div>
                                </div>
                            )}

                            {(activeTab === 'devoluciones' || (activeTab === 'recogidas' && recogidaTipoOrigen === 'Proveedor')) && (
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
                            )}

                            {(activeTab === 'recogidas' && recogidaTipoOrigen === 'Cliente') && (
                                <div className="form-group">
                                    <label>Cliente</label>
                                    <select
                                        className="input-field"
                                        value={selectedClientId}
                                        onChange={e => setSelectedClientId(e.target.value)}
                                    >
                                        <option value="">-- Seleccionar Cliente --</option>
                                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            )}

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
                .status-sin-despacho { background: #f1f5f9; color: #64748b; }
                .status-ganado { background: #d1fae5; color: #065f46; }

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
