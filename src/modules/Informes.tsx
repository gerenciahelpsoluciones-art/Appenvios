import React, { useState } from 'react';
import type { Cotizacion, SalesBudget, AppUser } from '../App';

interface IProps {
    cotizaciones: Cotizacion[];
    budgets: SalesBudget[];
    currentUser: AppUser;
    onUpdateQuote: (quote: Cotizacion) => void;
}

const InformesModule: React.FC<IProps> = ({ cotizaciones, budgets, currentUser, onUpdateQuote }) => {
    const today = new Date().toISOString().split('T')[0];
    const [fechaInicio, setFechaInicio] = useState(today);
    const [fechaFin, setFechaFin] = useState(today);

    // Month for budget comparison
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // State for dates that are actually being used for filtering
    const [appliedDates, setAppliedDates] = useState({ inicio: today, fin: today });

    const handleSearch = () => {
        setAppliedDates({ inicio: fechaInicio, fin: fechaFin });
    };

    const filteredQuotes = cotizaciones.filter(q => {
        return q.fecha >= appliedDates.inicio && q.fecha <= appliedDates.fin;
    });

    const totalVendido = filteredQuotes.reduce((acc, q) => acc + q.total, 0);

    // Monthly performance for cards
    const monthlySales = cotizaciones.filter(c => {
        if (!c.fecha) return false;
        const [y, m] = c.fecha.split('-').map(Number);
        return y === currentYear && (m - 1) === currentMonth && c.estado === 'Ganado';
    }).reduce((acc, c) => acc + c.total, 0);

    const activeBudget = budgets.find(b =>
        b.usuarioId === currentUser.id &&
        b.anio === currentYear &&
        b.mes === currentMonth
    )?.monto || 0;

    const executionPercent = activeBudget > 0 ? (monthlySales / activeBudget) * 100 : 0;
    const difference = monthlySales - activeBudget;

    const updateStatus = (quote: Cotizacion, newStatus: 'Seguimiento' | 'Ganado' | 'Perdido') => {
        onUpdateQuote({ ...quote, estado: newStatus });
    };

    return (
        <div className="reports-container">
            <div className="card filters-card">
                <h3>Rendimiento del Mes Actual</h3>
                <div className="stats-grid">
                    <div className="stat-card budget-card">
                        <div className="stat-label">Presupuesto Mensual</div>
                        <div className="stat-value">${activeBudget.toLocaleString()}</div>
                        <div className="stat-trend">Meta asignada</div>
                    </div>
                    <div className="stat-card sales-card">
                        <div className="stat-label">Ventas Logradas (Ganadas)</div>
                        <div className="stat-value">${monthlySales.toLocaleString()}</div>
                        <div className="stat-trend">Ejecutado</div>
                    </div>
                    <div className="stat-card percent-card">
                        <div className="stat-label">% Ejecución</div>
                        <div className="stat-value">{executionPercent.toFixed(1)}%</div>
                        <div className="stat-trend" style={{ background: difference >= 0 ? '#059669' : '#991b1b' }}>
                            {difference >= 0 ? `+ $${difference.toLocaleString()}` : `- $${Math.abs(difference).toLocaleString()}`}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card filters-card" style={{ marginTop: '1.5rem' }}>
                <h3>Filtrar Cotizaciones por Fecha</h3>
                <div className="filter-group">
                    <div className="input-box">
                        <label>Fecha Inicio</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                    </div>
                    <div className="input-box">
                        <label>Fecha Fin</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                    </div>
                    <div className="button-box">
                        <button className="btn btn-primary btn-search" onClick={handleSearch}>
                            🔍 Buscar
                        </button>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card stat-card">
                    <h4>Total en el Rango</h4>
                    <p className="stat-value">${totalVendido.toLocaleString()}</p>
                    <span className="stat-label">
                        {appliedDates.inicio} al {appliedDates.fin} • {filteredQuotes.length} cotizaciones
                    </span>
                </div>
            </div>

            <div className="card">
                <h3>Listado de Cotizaciones</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '100px' }}>Fecha</th>
                                <th style={{ minWidth: '120px' }}>Consecutivo</th>
                                <th style={{ minWidth: '200px' }}>Cliente</th>
                                <th className="text-right" style={{ minWidth: '110px' }}>Subtotal</th>
                                <th className="text-right" style={{ minWidth: '100px' }}>IVA</th>
                                <th className="text-right" style={{ minWidth: '120px' }}>Total</th>
                                <th style={{ minWidth: '150px' }}>Ejecutivo</th>
                                <th className="text-center" style={{ minWidth: '120px' }}>Estado</th>
                                <th className="text-center" style={{ minWidth: '150px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotes.length > 0 ? (
                                filteredQuotes.map((q) => (
                                    <tr key={q.id}>
                                        <td>{q.fecha}</td>
                                        <td><strong>{q.consecutivo}</strong></td>
                                        <td>{q.clienteNombre}</td>
                                        <td className="text-right">${q.subtotal.toLocaleString()}</td>
                                        <td className="text-right">${q.iva.toLocaleString()}</td>
                                        <td className="text-right"><strong>${q.total.toLocaleString()}</strong></td>
                                        <td>{q.ejecutivo}</td>
                                        <td className="text-center">
                                            <span className={`status-badge status-${(q.estado || 'Seguimiento').toLowerCase()}`}>
                                                {q.estado || 'Seguimiento'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <div className="status-actions">
                                                <button
                                                    className="btn-status btn-seguimiento"
                                                    onClick={() => updateStatus(q, 'Seguimiento')}
                                                    title="Seguimiento"
                                                >
                                                    ⏳
                                                </button>
                                                <button
                                                    className="btn-status btn-ganado"
                                                    onClick={() => updateStatus(q, 'Ganado')}
                                                    title="Ganado"
                                                >
                                                    ✅
                                                </button>
                                                <button
                                                    className="btn-status btn-perdido"
                                                    onClick={() => updateStatus(q, 'Perdido')}
                                                    title="Perdido"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No se encontraron cotizaciones en este rango de fechas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1rem;
                }
                .stat-card {
                    padding: 1.25rem;
                    border-radius: 12px;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .budget-card { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
                .sales-card { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
                .percent-card { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                .stat-label { font-size: 0.85rem; opacity: 0.9; }
                .stat-value { font-size: 1.5rem; font-weight: 800; }
                .stat-trend { font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 0.2rem 0.6rem; border-radius: 20px; align-self: flex-start; }

                .reports-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .filter-group {
                    display: flex;
                    gap: 1.5rem;
                    margin-top: 1rem;
                    align-items: flex-end;
                }
                .input-box {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .input-box input {
                    padding: 0.6rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                }
                .btn-search {
                    padding: 0.7rem 2rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    height: 42px;
                }
                .btn-search:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .text-right {
                    text-align: right;
                }
                .data-table th.text-right {
                    text-align: right;
                }
                .data-table td.text-right {
                    font-family: 'Courier New', Courier, monospace; /* Opcional: fuente monoespaciada para alineación perfecta */
                    font-weight: 500;
                }
                .status-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .status-seguimiento { background-color: #fef3c7; color: #92400e; }
                .status-ganado { background-color: #d1fae5; color: #065f46; }
                .status-perdido { background-color: #fee2e2; color: #991b1b; }
                
                .status-actions {
                    display: flex;
                    gap: 0.25rem;
                }
                .btn-status {
                    border: none;
                    background: none;
                    cursor: pointer;
                    padding: 0.2rem;
                    border-radius: 4px;
                    font-size: 1rem;
                    transition: background 0.2s;
                }
                .btn-status:hover {
                    background: var(--background-light);
                }
                .btn-seguimiento:hover { background: #fef3c7; }
                .btn-ganado:hover { background: #d1fae5; }
                .btn-perdido:hover { background: #fee2e2; }
            `}</style>
        </div>
    );
};

export default InformesModule;
