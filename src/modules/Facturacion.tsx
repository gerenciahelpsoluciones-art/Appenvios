import React, { useState } from 'react';
import type { Despacho, Cotizacion, Cliente, Producto } from '../App';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { supabase } from '../lib/supabaseClient';

interface IProps {
    despachos: Despacho[];
    cotizaciones: Cotizacion[];
    clientes: Cliente[];
    productos: Producto[];
    onUpdateDespacho: (d: Despacho) => void;
    onUpdateQuote: (c: Cotizacion) => void;
}

const FacturacionModule: React.FC<IProps> = ({ despachos, cotizaciones, clientes, productos, onUpdateDespacho, onUpdateQuote }) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');
    const [searchTerm, setSearchTerm] = useState('');
    const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth);
    const [fechaFin, setFechaFin] = useState(lastDayOfMonth);
    const [viewingCot, setViewingCot] = useState<Cotizacion | null>(null);

    // Filtering logic
    const entregados = despachos.filter(d => d.estado === 'Entregado');
    const pendientes = entregados.filter(d => !d.facturado);
    const historial = entregados.filter(d => {
        if (!d.facturado) return false;
        // Si estamos en la pestaña de historial, aplicamos el filtro de fecha
        const dateMatch = d.fechaSolicitud >= fechaInicio && d.fechaSolicitud <= fechaFin;
        return dateMatch;
    });

    const displayList = activeTab === 'pendientes' ? pendientes : historial;

    const filteredList = displayList.filter(d =>
        d.consecutivoCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.clienteId && d.clienteId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleFacturar = (d: Despacho) => {
        if (window.confirm(`¿Marcar el pedido ${d.consecutivoCotizacion} como FACTURADO?`)) {
            const fechaHoy = new Date().toISOString().split('T')[0];
            onUpdateDespacho({ ...d, facturado: true, fechaFacturado: fechaHoy });
        }
    };

    const findCotizacion = (id: string) => cotizaciones.find(c => c.id === id);

    const handleGeneratePDF = (cot: Cotizacion, action: 'save' | 'view' = 'save') => {
        const cliente = clientes.find(c => c.id === cot.clienteId);
        if (!cliente) {
            alert('No se encontró la información del cliente para generar el PDF.');
            return;
        }
        generateQuotationPDF({
            consecutivo: cot.consecutivo,
            cliente,
            items: cot.items,
            productos,
            subtotal: cot.subtotal,
            iva: cot.iva,
            total: cot.total,
            condiciones: (cot as any).condiciones || '',
            ejecutivo: {
                nombre: cot.ejecutivo || 'N/A',
                cargo: 'Ejecutivo Comercial',
                telefono: cot.ejecutivoTelefono || '',
                correo: cot.ejecutivoEmail || ''
            }
        }, action);
    };

    const handleOCUpload = async (cot: Cotizacion, file: File | null) => {
        if (!file) return;

        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `ordenes_compra_clientes/${cot.id}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from('entregas') // Reusing the 'entregas' bucket as it's already configured
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Error subiendo O.C.:', uploadError);
            alert(`Error al subir O.C.: ${uploadError.message}`);
            return;
        }

        const { data: urlData } = supabase.storage
            .from('entregas')
            .getPublicUrl(filePath);

        const publicUrl = urlData?.publicUrl || '';
        onUpdateQuote({ ...cot, ordenCompraUrl: publicUrl });
        alert('✅ Orden de Compra adjuntada correctamente.');
    };

    return (
        <div className="module-container">
            <div className="module-header" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Dashboard de Facturación</h2>
                    <div className="search-bar" style={{ minWidth: '300px', flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Buscar pedido, cliente o NIT..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-input"
                            style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                </div>

                {activeTab === 'historial' && (
                    <div className="date-filters animate-fade-in" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        background: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b' }}>📅 Rango Historial:</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                                <input 
                                    type="date" 
                                    className="input-field" 
                                    style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                                    value={fechaInicio}
                                    onChange={e => setFechaInicio(e.target.value)}
                                />
                                <span style={{ color: '#94a3b8' }}>a</span>
                                <input 
                                    type="date" 
                                    className="input-field" 
                                    style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                                    value={fechaFin}
                                    onChange={e => setFechaFin(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                            Viendo lo facturado entre {fechaInicio} y {fechaFin}
                        </div>
                    </div>
                )}
            </div>

            <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <button
                    style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'pendientes' ? '#0369a1' : '#64748b', borderBottom: activeTab === 'pendientes' ? '3px solid #0369a1' : '3px solid transparent' }}
                    onClick={() => setActiveTab('pendientes')}
                >
                    Pendientes por Facturar ({pendientes.length})
                </button>
                <button
                    style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'historial' ? '#15803d' : '#64748b', borderBottom: activeTab === 'historial' ? '3px solid #15803d' : '3px solid transparent' }}
                    onClick={() => setActiveTab('historial')}
                >
                    Historial Facturado ({historial.length})
                </button>
            </div>

            <div className="card table-card animate-fade-in" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Cotización / Fecha Ent.</th>
                            <th>Cliente</th>
                            <th>Evidencias</th>
                            <th className="text-right">Monto Total</th>
                            <th className="text-center">Estado / Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredList.map(d => {
                            const cot = findCotizacion(d.cotizacionId);
                            return (
                                <tr key={d.id}>
                                    <td style={{ opacity: activeTab === 'historial' ? 0.75 : 1 }}>
                                        <strong>{d.consecutivoCotizacion}</strong>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Entrega: {d.fechaSolicitud}</div>
                                    </td>
                                    <td style={{ opacity: activeTab === 'historial' ? 0.75 : 1 }}>
                                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{d.clienteNombre}</div>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>NIT: {d.clienteId}</div>
                                    </td>
                                    <td style={{ verticalAlign: 'top', padding: activeTab === 'historial' ? '0.5rem 0.75rem' : '0.75rem' }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: activeTab === 'historial' ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))',
                                            gap: '0.5rem',
                                            padding: '0.25rem 0'
                                        }}>
                                            {/* Sección Cotización */}
                                            <div className="evidence-group" style={{
                                                background: activeTab === 'historial' ? '#f1f5f9' : '#f8fafc',
                                                padding: '0.4rem',
                                                borderRadius: '8px',
                                                border: activeTab === 'historial' ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                                                opacity: activeTab === 'historial' ? 0.9 : 1
                                            }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.025em' }}>Cotización</div>
                                                {cot ? (
                                                    <div style={{ display: 'flex', gap: '0.3rem', flexDirection: 'column' }}>
                                                        <button
                                                            onClick={() => setViewingCot(cot)}
                                                            className="btn-evidence"
                                                            style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                                                        >
                                                            📋 Detalles
                                                        </button>
                                                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                            <button
                                                                onClick={() => handleGeneratePDF(cot, 'view')}
                                                                className="btn-evidence-icon"
                                                                style={{ background: '#f0fdfa', color: '#0d9488', border: '1px solid #ccfbf1', flex: 1 }}
                                                                title="Visualizar PDF"
                                                            >
                                                                👁️
                                                            </button>
                                                            <button
                                                                onClick={() => handleGeneratePDF(cot, 'save')}
                                                                className="btn-evidence-icon"
                                                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', flex: 1 }}
                                                                title="Descargar PDF"
                                                            >
                                                                🖨️
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No encontrada</div>
                                                )}
                                            </div>

                                            {/* Sección O.C. Cliente */}
                                            <div className="evidence-group" style={{
                                                background: activeTab === 'historial' ? '#f1f5f9' : '#f8fafc',
                                                padding: '0.4rem',
                                                borderRadius: '8px',
                                                border: activeTab === 'historial' ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                                                opacity: activeTab === 'historial' ? 0.9 : 1
                                            }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.025em' }}>O.C. Cliente</div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: cot?.ordenCompraCliente ? '#0f172a' : '#94a3b8', marginBottom: '0.4rem' }}>
                                                    {cot?.ordenCompraCliente || 'Sin número'}
                                                </div>
                                                {cot?.ordenCompraUrl ? (
                                                    <a
                                                        href={cot.ordenCompraUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn-evidence"
                                                        style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', textAlign: 'center', textDecoration: 'none', display: 'block' }}
                                                    >
                                                        🔗 Ver Archivo
                                                    </a>
                                                ) : cot ? (
                                                    <label className="btn-evidence" style={{ background: '#ffffff', color: '#64748b', border: '1px dashed #cbd5e1', textAlign: 'center', cursor: 'pointer', display: 'block' }}>
                                                        📎 Adjuntar
                                                        <input type="file" style={{ display: 'none' }} onChange={(e) => handleOCUpload(cot, e.target.files?.[0] || null)} />
                                                    </label>
                                                ) : null}
                                            </div>

                                            {/* Sección Logística */}
                                            <div className="evidence-group" style={{
                                                background: activeTab === 'historial' ? '#f1f5f9' : '#f8fafc',
                                                padding: '0.4rem',
                                                borderRadius: '8px',
                                                border: activeTab === 'historial' ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                                                gridColumn: 'span 1',
                                                opacity: activeTab === 'historial' ? 0.9 : 1
                                            }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.025em' }}>Logística</div>
                                                {d.fotoRemision || d.fotoEntrega ? (
                                                    <div style={{ display: 'flex', gap: '0.3rem', flexDirection: 'column' }}>
                                                        {d.fotoRemision && (
                                                            <a href={d.fotoRemision} target="_blank" rel="noreferrer" className="btn-evidence" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', textDecoration: 'none', textAlign: 'center' }}>
                                                                📦 Remisión
                                                            </a>
                                                        )}
                                                        {d.fotoEntrega && (
                                                            <a href={d.fotoEntrega} target="_blank" rel="noreferrer" className="btn-evidence" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', textDecoration: 'none', textAlign: 'center' }}>
                                                                🚚 Entrega
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>⚠️ Sin fotos</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>
                                            ${d.total.toLocaleString()}
                                        </strong>
                                    </td>
                                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                        {activeTab === 'pendientes' ? (
                                            <button
                                                className="btn-success"
                                                style={{ width: '100%', maxWidth: '140px', padding: '0.6rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.4)' }}
                                                onClick={() => handleFacturar(d)}
                                                title="Marcar este envío como Facturado"
                                            >
                                                ✅ Facturado
                                            </button>
                                        ) : (
                                            <span style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #bbf7d0' }}>
                                                ✓ Facturado
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {filteredList.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                                        {activeTab === 'pendientes' ? '🎉' : '📂'}
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                        No se encontraron despachos {activeTab === 'pendientes' ? 'pendientes por facturar' : 'en el historial facturado'}.
                                    </div>
                                    {searchTerm && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                            Intenta con otros términos de búsqueda.
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL VER COTIZACIÓN */}
            {viewingCot && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="card animate-fade-in" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>📄 Detalles de la Cotización</h3>
                                <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                    <span style={{ fontWeight: 700, color: '#0369a1' }}>{viewingCot.consecutivo}</span> · {viewingCot.fecha}
                                </div>
                            </div>
                            <button onClick={() => setViewingCot(null)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem' }}>×</button>
                        </div>

                        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div className="detail-item">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Cliente</label>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{viewingCot.clienteNombre}</div>
                                </div>
                                <div className="detail-item">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Ejecutivo</label>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{viewingCot.ejecutivo || 'No asignado'}</div>
                                </div>
                                <div className="detail-item">
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Estado</label>
                                    <div><span style={{ background: viewingCot.estado === 'Ganado' ? '#dcfce7' : '#fef3c7', color: viewingCot.estado === 'Ganado' ? '#166534' : '#92400e', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>{viewingCot.estado}</span></div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>Productos / Servicios</label>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Descripción</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Cant.</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>P. Unitario</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingCot.items.map((item: any, idx: number) => {
                                                const subtotal = (item.costoUnitario || 0) * (item.cantidad || 0);
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '0.75rem 1rem' }}>
                                                            <div style={{ fontWeight: 500 }}>{item.nombreProducto || productos.find(p => p.id === item.productoId)?.nombre || item.productoId}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.unidad || 'Und'}</div>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{item.cantidad}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>${(item.costoUnitario || 0).toLocaleString()}</td>
                                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>${subtotal.toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                                <div style={{ flex: 1, minWidth: '250px' }}>
                                    {(viewingCot.ordenCompraCliente || viewingCot.ordenCompraUrl) && (
                                        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Orden de Compra Cliente</label>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700, color: '#0c4a6e' }}>{viewingCot.ordenCompraCliente || 'N/A'}</span>
                                                {viewingCot.ordenCompraUrl && (
                                                    <a href={viewingCot.ordenCompraUrl} target="_blank" rel="noreferrer" className="btn-evidence" style={{ background: 'white', color: '#0284c7', border: '1px solid #0284c7', textDecoration: 'none' }}>
                                                        👁️ Ver O.C.
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#64748b' }}>Subtotal:</span>
                                        <span style={{ fontWeight: 600 }}>${(viewingCot.subtotal || 0).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#64748b' }}>IVA:</span>
                                        <span style={{ fontWeight: 600 }}>${(viewingCot.iva || 0).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', paddingTop: '0.5rem', borderTop: '2px solid #f1f5f9', marginTop: '0.25rem' }}>
                                        <span style={{ fontWeight: 700, color: '#0f172a' }}>Total:</span>
                                        <span style={{ fontWeight: 800, color: '#0369a1' }}>${(viewingCot.total || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => handleGeneratePDF(viewingCot, 'view')}
                                style={{ flex: 1, padding: '0.75rem', background: '#0D9488', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                            >
                                👁️ Visualizar PDF
                            </button>
                            <button
                                onClick={() => handleGeneratePDF(viewingCot, 'save')}
                                style={{ flex: 1, padding: '0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                            >
                                📥 Descargar PDF
                            </button>
                            <button onClick={() => setViewingCot(null)} style={{ padding: '0.75rem 1.5rem', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .btn-evidence {
                    padding: 0.35rem 0.6rem;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .btn-evidence:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .btn-evidence-icon {
                    padding: 0.35rem;
                    border-radius: 6px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-evidence-icon:hover {
                    transform: scale(1.1);
                }
                .evidence-group {
                    transition: all 0.2s;
                }
                .evidence-group:hover {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .data-table th {
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                    color: #64748b;
                }
            `}</style>
        </div>
    );
};

export default FacturacionModule;
