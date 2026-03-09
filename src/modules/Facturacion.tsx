import React, { useState } from 'react';
import type { Despacho, Cotizacion } from '../App';

interface IProps {
    despachos: Despacho[];
    cotizaciones: Cotizacion[];
    onUpdateDespacho: (d: Despacho) => void;
}

const FacturacionModule: React.FC<IProps> = ({ despachos, cotizaciones, onUpdateDespacho }) => {
    const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');
    const [searchTerm, setSearchTerm] = useState('');

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
                                            {/* Cotización status */}
                                            <span style={{ color: cot ? '#0369a1' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                📄 Cotización: {cot ? <strong>Disponible</strong> : 'No Encontrada'}
                                            </span>

                                            {/* Orden de Compra Cliente */}
                                            {cot?.ordenCompraCliente ? (
                                                <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    🛒 O.C. Cliente: <strong>{cot.ordenCompraCliente}</strong>
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    🛒 O.C. Cliente: N/A
                                                </span>
                                            )}

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
        </div>
    );
};

export default FacturacionModule;
