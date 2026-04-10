import React, { useState } from 'react';
import type { AppUser, SalesBudget, Cotizacion, VentaManual } from '../App';
import { generateCommercialReportPDF } from '../utils/pdfGenerator';

interface IProps {
    users: AppUser[];
    budgets: SalesBudget[];
    cotizaciones: Cotizacion[];
    ventasManuales: VentaManual[];
    despachos: any[];
    ordenesCompra: any[];
    currentUser: AppUser;
}

const Vendedores: React.FC<IProps> = ({ users, budgets, cotizaciones, ventasManuales, despachos, ordenesCompra, currentUser }) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth);
    const [fechaFin, setFechaFin] = useState(today);
    const [appliedFilters, setAppliedFilters] = useState({ inicio: firstDayOfMonth, fin: today });

    // Include all users who have a budget assigned (any month), plus Comercials
    const userIdsWithBudget = new Set(budgets.map(b => b.usuarioId));
    const vendedores = users.filter(u => {
        // Fundamental constraint: Seller must have a budget assigned to appear here
        if (!userIdsWithBudget.has(u.id)) return false;

        const rol = (u.rol || '').toLowerCase();
        
        // Exclude technical and logistics staff even if they have a budget (safety check)
        if (rol.includes('tecnico') || rol.includes('técnico') || rol.includes('logistica') || rol.includes('logística')) {
            return false;
        }

        return true;
    });

    const getBudgetForPeriod = (userId: string, start: string, end: string) => {
        const [startY, startM] = start.split('-').map(Number);
        const [endY, endM] = end.split('-').map(Number);
        
        // For simplicity, if range covers multiple months, we sum them. 
        // Usually, management looks at one month or a specific range within a month.
        return budgets.filter(b => 
            b.usuarioId === userId && 
            ((b.anio > startY || (b.anio === startY && b.mes >= (startM - 1))) &&
             (b.anio < endY || (b.anio === endY && b.mes <= (endM - 1))))
        ).reduce((acc, b) => acc + b.monto, 0);
    };

    const getSalesForPeriod = (userId: string, start: string, end: string) => {
        const quoteSales = cotizaciones
            .filter(c => {
                if (!c.fecha || c.estado !== 'Ganado' || c.usuarioId !== userId) return false;
                return c.fecha >= start && c.fecha <= end;
            })
            .reduce((acc, c) => acc + c.total, 0);

        const manualSales = (ventasManuales || []).filter(v => {
            if (!v.fecha || v.usuarioId !== userId) return false;
            return v.fecha >= start && v.fecha <= end;
        }).reduce((acc, v) => acc + v.monto, 0);

        return quoteSales + manualSales;
    };

    const getLogisticsForPeriod = (userId: string, start: string, end: string) => {
        const userDespachos = (despachos || []).filter(d => 
            d.usuarioId === userId && d.fechaSolicitud >= start && d.fechaSolicitud <= end
        ).length;

        const userRecogidas = (ordenesCompra || []).filter(oc => 
            oc.usuarioId === userId && oc.tipo === 'Recogida' && oc.fecha >= start && oc.fecha <= end
        ).length;

        return { despachos: userDespachos, recogidas: userRecogidas, total: userDespachos + userRecogidas };
    };

    const getMonthlyHistory = (userId: string) => {
        const history = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth();
            const y = d.getFullYear();
            const monthStr = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
            
            const monthStart = new Date(y, m, 1).toISOString().split('T')[0];
            const monthEnd = new Date(y, m + 1, 0).toISOString().split('T')[0];
            
            const budget = getBudgetForPeriod(userId, monthStart, monthEnd);
            const sales = getSalesForPeriod(userId, monthStart, monthEnd);
            const quotes = cotizaciones.filter(c => c.usuarioId === userId && c.fecha >= monthStart && c.fecha <= monthEnd).length;
            
            history.push({ month: monthStr, budget, sales, quotes, percent: budget > 0 ? (sales / budget) * 100 : 0 });
        }
        return history;
    };

    // Filter: Admins see all, others see only themselves
    const displayedVendedores = currentUser.rol === 'Admin' || currentUser.cargo?.toLowerCase().includes('gerente') || currentUser.cargo?.toLowerCase().includes('administrador')
        ? vendedores
        : vendedores.filter(v => v.id === currentUser.id);

    const formatCurrency = (val: number) => `$${Math.round(val).toLocaleString('es-CO')}`;

    const handleDownloadPDF = () => {
        const reportData = displayedVendedores.map(v => {
            const budget = getBudgetForPeriod(v.id, appliedFilters.inicio, appliedFilters.fin);
            const sales = getSalesForPeriod(v.id, appliedFilters.inicio, appliedFilters.fin);
            const logistics = getLogisticsForPeriod(v.id, appliedFilters.inicio, appliedFilters.fin);
            const history = getMonthlyHistory(v.id);
            return {
                vendedor: v.nombre,
                cargo: v.cargo || 'Asesor Comercial',
                meta: budget,
                logrado: sales,
                cumplimiento: budget > 0 ? (sales / budget) * 100 : 0,
                envios: logistics.despachos,
                recogidas: logistics.recogidas,
                historial: history
            };
        });

        generateCommercialReportPDF({
            periodo: { inicio: appliedFilters.inicio, fin: appliedFilters.fin },
            data: reportData
        });
    };

    const handleSearch = () => {
        setAppliedFilters({ inicio: fechaInicio, fin: fechaFin });
    };

    return (
        <div className="module-container">
            <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2>Gestión Comercial y Ventas</h2>
                    <p>Herramienta de seguimiento para Gerencia y Administración</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button className="btn-success" onClick={handleDownloadPDF} title="Descargar Reporte Gerencial">📊 Descargar PDF Gerencial</button>
                </div>
            </div>

            <div className="card filters-card" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Desde</label>
                        <input type="date" className="input-field" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Hasta</label>
                        <input type="date" className="input-field" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                    </div>
                    <button className="btn-primary" onClick={handleSearch} style={{ height: '42px' }}>🔍 Filtrar Periodo</button>
                </div>
            </div>

            <div className="vendedores-grid">
                {displayedVendedores.map(v => {
                    const budget = getBudgetForPeriod(v.id, appliedFilters.inicio, appliedFilters.fin);
                    const sales = getSalesForPeriod(v.id, appliedFilters.inicio, appliedFilters.fin);
                    const logistics = getLogisticsForPeriod(v.id, appliedFilters.inicio, appliedFilters.fin);
                    const history = getMonthlyHistory(v.id);
                    const percent = budget > 0 ? (sales / budget) * 100 : 0;
                    const performanceColor = percent >= 80 ? '#10b981' : percent >= 60 ? '#f59e0b' : '#dc2626';

                    return (
                        <div key={v.id} className="card vendedor-card animate-fade-in" style={{ gridColumn: 'span 3' }}>
                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                {/* User Profile & Main KPI */}
                                <div style={{ flex: '1 1 280px' }}>
                                    <div className="vendedor-header">
                                        <div className="vendedor-avatar" style={{ background: performanceColor }}>
                                            {v.nombre.charAt(0)}
                                        </div>
                                        <div className="vendedor-info">
                                            <h3>{v.nombre}</h3>
                                            <p>{v.cargo || 'Asesor Comercial'}</p>
                                        </div>
                                        <div className="percent-badge" style={{ backgroundColor: performanceColor + '20', color: performanceColor }}>
                                            {percent.toFixed(1)}%
                                        </div>
                                    </div>

                                    <div className="performance-section">
                                        <div className="chart-container">
                                            <div className="bar-group">
                                                <div className="bar-label">
                                                    <span>Meta Periodo: {formatCurrency(budget)}</span>
                                                </div>
                                                <div className="bar-bg">
                                                    <div className="bar-fill budget-bar" style={{ width: '100%' }}></div>
                                                </div>
                                            </div>
                                            <div className="bar-group">
                                                <div className="bar-label">
                                                    <span>Logrado: {formatCurrency(sales)}</span>
                                                </div>
                                                <div className="bar-bg">
                                                    <div className="bar-fill sales-bar" style={{
                                                        width: `${Math.min(percent, 100)}%`,
                                                        backgroundColor: performanceColor
                                                    }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="trend-indicator" style={{ color: performanceColor }}>
                                            {percent >= 100 ? '🚀 Meta Superada' : percent >= 80 ? '📈 Excelente' : percent >= 60 ? '⚠️ En progreso' : '📉 Por mejorar'}
                                            <div className="trend-sub">
                                                Diferencia: {formatCurrency(sales - budget)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="logistics-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                        <div className="stat-card" style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>📦 Envíos</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{logistics.despachos}</div>
                                        </div>
                                        <div className="stat-card" style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>🚚 Recogidas</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>{logistics.recogidas}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* monthly History Table */}
                                <div style={{ flex: '3 1 600px', borderLeft: '1px solid #e2e8f0', paddingLeft: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem', color: '#475569' }}>📊 Historial de los últimos 6 meses</h4>
                                    <table className="data-table" style={{ fontSize: '0.85rem', width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Mes</th>
                                                <th className="text-right" style={{ padding: '0.75rem 0.5rem', minWidth: '100px' }}>Meta</th>
                                                <th className="text-right" style={{ padding: '0.75rem 0.5rem', minWidth: '100px' }}>Venta</th>
                                                <th className="text-center" style={{ padding: '0.75rem 0.5rem' }}>Cotiz.</th>
                                                <th className="text-right" style={{ padding: '0.75rem 0.5rem' }}>% Cumpl.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map((h, i) => (
                                                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                                                    <td style={{ fontWeight: i === 5 ? 'bold' : 'normal', padding: '0.75rem 0.5rem' }}>{h.month}</td>
                                                    <td className="text-right" style={{ padding: '0.75rem 0.5rem' }}>{formatCurrency(h.budget)}</td>
                                                    <td className="text-right" style={{ fontWeight: 'bold', padding: '0.75rem 0.5rem' }}>{formatCurrency(h.sales)}</td>
                                                    <td className="text-center" style={{ padding: '0.75rem 0.5rem' }}>{h.quotes}</td>
                                                    <td className="text-right" style={{ padding: '0.75rem 0.5rem' }}>
                                                        <span style={{ 
                                                            color: h.percent >= 80 ? '#166534' : h.percent >= 60 ? '#92400e' : '#991b1b',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {h.percent.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {displayedVendedores.length === 0 && (
                    <div className="card empty-state">
                        <p>No hay información de ventas disponible para mostrar.</p>
                    </div>
                )}
            </div>



            <style>{`
                .vendedores-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }

                .vendedor-card {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .vendedor-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                }

                .vendedor-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    position: relative;
                }

                .percent-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 700;
                }

                .performance-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem 0;
                    border-top: 1px solid var(--border-color);
                }

                .chart-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .bar-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .bar-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-muted);
                }

                .bar-bg {
                    height: 10px;
                    background: #f1f5f9;
                    border-radius: 5px;
                    overflow: hidden;
                }

                .bar-fill {
                    height: 100%;
                    border-radius: 5px;
                    transition: width 0.6s ease-out;
                }

                .budget-bar {
                    background: #cbd5e1;
                }

                .trend-indicator {
                    font-size: 0.95rem;
                    font-weight: 700;
                    text-align: center;
                    margin-top: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .trend-sub {
                    font-size: 0.75rem;
                    font-weight: 400;
                    color: var(--text-muted);
                }

                .vendedor-avatar {
                    width: 50px;
                    height: 50px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 1.5rem;
                    font-weight: 700;
                }

                .vendedor-info h3 {
                    margin: 0;
                    font-size: 1.1rem;
                }

                .vendedor-info p {
                    margin: 0;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }

                .vendedor-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem 0;
                    border-top: 1px solid var(--border-color);
                    border-bottom: 1px solid var(--border-color);
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                }

                .stat-item label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    font-weight: 600;
                }

                .stat-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--primary-blue);
                }

                .stat-detail {
                    font-size: 0.85rem;
                    color: var(--text-main);
                }

                .vendedor-actions {
                    display: flex;
                    justify-content: flex-end;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 500px;
                }
            `}</style>
        </div>
    );
};

export default Vendedores;
