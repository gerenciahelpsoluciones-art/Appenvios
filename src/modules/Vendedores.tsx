import React from 'react';
import type { AppUser, SalesBudget, Cotizacion, VentaManual } from '../App';

interface IProps {
    users: AppUser[];
    budgets: SalesBudget[];
    cotizaciones: Cotizacion[];
    ventasManuales: VentaManual[];
    currentUser: AppUser;
}

const Vendedores: React.FC<IProps> = ({ users, budgets, cotizaciones, ventasManuales, currentUser }) => {
    // Include all users who have a budget assigned (any month), plus Comercials
    const userIdsWithBudget = new Set(budgets.map(b => b.usuarioId));
    const vendedores = users.filter(u =>
        u.rol === 'Comercial' ||
        (u.cargo && u.cargo.toLowerCase().includes('comercial')) ||
        userIdsWithBudget.has(u.id)
    );


    const getBudgetForUser = (userId: string, month: number, year: number) => {
        const budget = budgets.find(b => b.usuarioId === userId && b.anio === year && b.mes === month);
        return budget ? budget.monto : 0;
    };

    const getSalesForUser = (userId: string, month: number, year: number) => {
        const quoteSales = cotizaciones
            .filter(c => {
                if (!c.fecha || c.estado !== 'Ganado' || c.usuarioId !== userId) return false;
                const [y, m] = c.fecha.split('-').map(Number);
                return y === year && (m - 1) === month;
            })
            .reduce((acc, c) => acc + c.total, 0);

        const manualSales = (ventasManuales || []).filter(v => {
            if (!v.fecha || v.usuarioId !== userId) return false;
            const [y, m] = v.fecha.split('-').map(Number);
            return y === year && (m - 1) === month;
        }).reduce((acc, v) => acc + v.monto, 0);

        return quoteSales + manualSales;
    };

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    // Filter: Admins see all, others see only themselves
    const displayedVendedores = currentUser.rol === 'Admin'
        ? vendedores
        : vendedores.filter(v => v.id === currentUser.id);

    const formatCurrency = (val: number) => `$${Math.round(val).toLocaleString('es-CO')}`;

    return (
        <div className="module-container">
            <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Asesores Comerciales</h2>
                    <p>Gestión y seguimiento de equipo de ventas</p>
                </div>
            </div>

            <div className="vendedores-grid">
                {displayedVendedores.map(v => {
                    const budget = getBudgetForUser(v.id, curMonth, curYear);
                    const sales = getSalesForUser(v.id, curMonth, curYear);
                    const percent = budget > 0 ? (sales / budget) * 100 : 0;
                    // Colors: <60% Red, 60-80% Orange, >=80% Green
                    const performanceColor = percent >= 80 ? '#10b981' : percent >= 60 ? '#f59e0b' : '#dc2626';

                    return (
                        <div key={v.id} className="card vendedor-card animate-fade-in">
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
                                            <span>Meta: {formatCurrency(budget)}</span>
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
                                    {percent >= 100 ? '🚀 Meta Superada' : percent >= 80 ? '📈 En excelente camino' : percent >= 60 ? '⚠️ Necesita impulso' : '📉 Nivel Crítico'}
                                    <div className="trend-sub">
                                        Faltan {formatCurrency(Math.max(0, budget - sales))} para la meta
                                    </div>
                                </div>
                            </div>

                            <div className="vendedor-stats">
                                <div className="stat-item">
                                    <label>Contacto</label>
                                    <span className="stat-detail">📧 {v.email}</span>
                                    <span className="stat-detail">📱 {v.telefono}</span>
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
