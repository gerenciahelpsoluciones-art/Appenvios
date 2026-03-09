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
    const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingCot, setViewingCot] = useState<Cotizacion | null>(null);

    // Filtering logic
    const entregados = despachos.filter(d => d.estado === 'Entregado');
    const pendientes = entregados.filter(d => !d.facturado);
    const historial = entregados.filter(d => d.facturado);

    const displayList = activeTab === 'pendientes' ? pendientes : historial;

    const filteredList = displayList.filter(d =>
        d.consecutivoCotizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.clienteId && d.clienteId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleFacturar = (d: Despacho) => {
        if (window.confirm(`¿Marcar el pedido ${d.consecutivoCotizacion} como FACTURADO?`)) {
            onUpdateDespacho({ ...d, facturado: true });
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
            <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <h2>Dashboard de Facturación</h2>
                <div className="search-bar" style={{ minWidth: '300px' }}>
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
                                    <td>
                                        <strong>{d.consecutivoCotizacion}</strong>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Entrega: {d.fechaSolicitud}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{d.clienteNombre}</div>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>NIT: {d.clienteId}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                                            {/* Botón Cotización */}
                                            {cot ? (
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button
                                                        onClick={() => setViewingCot(cot)}
                                                        style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                                    >
                                                        📄 Ver Cotización
                                                    </button>
                                                    <button
                                                        onClick={() => handleGeneratePDF(cot, 'view')}
                                                        style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', color: '#0d9488', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                                    >
                                                        👁️ Visualizar
                                                    </button>
                                                    <button
                                                        onClick={() => handleGeneratePDF(cot, 'save')}
                                                        style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                                    >
                                                        🖨️ PDF
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>📄 Cotización no encontrada</span>
                                            )}

                                            {/* Orden de Compra Cliente */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                {cot?.ordenCompraCliente ? (
                                                    <span style={{ color: '#0284c7' }}>
                                                        🛒 O.C. Cliente: <strong>{cot.ordenCompraCliente}</strong>
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8' }}>
                                                        🛒 O.C. Cliente: N/A
                                                    </span>
                                                )}

                                                {cot?.ordenCompraUrl ? (
                                                    <a
                                                        href={cot.ordenCompraUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1', borderRadius: '4px', padding: '0.1rem 0.4rem', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none' }}
                                                    >
                                                        🔗 Ver Archivo
                                                    </a>
                                                ) : cot ? (
                                                    <label style={{ background: '#f1f5f9', border: '1px dotted #cbd5e1', color: '#64748b', borderRadius: '4px', padding: '0.1rem 0.4rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        📎 Adjuntar O.C.
                                                        <input
                                                            type="file"
                                                            style={{ display: 'none' }}
                                                            onChange={(e) => handleOCUpload(cot, e.target.files?.[0] || null)}
                                                        />
                                                    </label>
                                                ) : null}
                                            </div>

                                            {/* Remision / Foto Entrega */}
                                            {d.fotoRemision || d.fotoEntrega ? (
                                                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.2rem' }}>
                                                    {d.fotoRemision && (
                                                        <a href={d.fotoRemision} target="_blank" rel="noreferrer" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 'bold', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                            📸 Ver Remisión
                                                        </a>
                                                    )}
                                                    {d.fotoEntrega && (
                                                        <a href={d.fotoEntrega} target="_blank" rel="noreferrer" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 'bold', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                            📸 Ver Foto
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#ef4444', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    ⚠️ Sin evidencias gráficas
                                                </span>
                                            )}
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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '700px', width: '95%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#0f172a' }}>📄 Cotización: {viewingCot.consecutivo}</h3>
                                <small style={{ color: '#64748b' }}>Fecha: {viewingCot.fecha} · Ejecutivo: {viewingCot.ejecutivo || 'N/A'}</small>
                            </div>
                            <button onClick={() => setViewingCot(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }}>CLIENTE</div>
                                <strong>{viewingCot.clienteNombre}</strong>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }}>ESTADO COTIZACIÓN</div>
                                <strong>{viewingCot.estado}</strong>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Producto</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Cant.</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Precio Unit.</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>IVA %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewingCot.items.map((item: any, idx: number) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '0.65rem 0.75rem' }}>{item.nombreProducto || productos.find(p => p.id === item.productoId)?.nombre || item.productoId}</td>
                                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>{item.cantidad}</td>
                                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>${(item.costoUnitario || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>{item.iva}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', fontSize: '0.9rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                            <span>Subtotal: <strong>${(viewingCot.subtotal || 0).toLocaleString()}</strong></span>
                            <span>IVA: <strong>${(viewingCot.iva || 0).toLocaleString()}</strong></span>
                            <span style={{ fontSize: '1.1rem', color: '#0f172a' }}>Total: <strong>${(viewingCot.total || 0).toLocaleString()}</strong></span>
                        </div>

                        {viewingCot.ordenCompraCliente && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#eff6ff', borderRadius: '8px', color: '#1d4ed8', fontWeight: 600 }}>
                                🛒 Orden de Compra Cliente: {viewingCot.ordenCompraCliente}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => handleGeneratePDF(viewingCot)}
                                style={{ flex: 1, padding: '0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                🖨️ Descargar PDF
                            </button>
                            <button onClick={() => setViewingCot(null)} style={{ flex: 1, padding: '0.75rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacturacionModule;
