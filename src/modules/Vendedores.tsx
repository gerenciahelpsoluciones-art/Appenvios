import React from 'react';
import type { AppUser, SalesBudget } from '../App';

interface IProps {
    users: AppUser[];
    budgets: SalesBudget[];
}

const Vendedores: React.FC<IProps> = ({ users, budgets }) => {
    const vendedores = users.filter(u => u.rol === 'Comercial' || (u.cargo && u.cargo.toLowerCase().includes('comercial')));


    const getBudgetForUser = (userId: string) => {
        const now = new Date();
        const budget = budgets.find(b => b.usuarioId === userId && b.anio === now.getFullYear() && b.mes === now.getMonth());
        return budget ? budget.monto : 0;
    };

    return (
        <div className="module-container">
            <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Asesores Comerciales</h2>
                    <p>Gestión y seguimiento de equipo de ventas</p>
                </div>
            </div>

            <div className="vendedores-grid">
                {vendedores.map(v => (
                    <div key={v.id} className="card vendedor-card animate-fade-in">
                        <div className="vendedor-header">
                            <div className="vendedor-avatar">
                                {v.nombre.charAt(0)}
                            </div>
                            <div className="vendedor-info">
                                <h3>{v.nombre}</h3>
                                <p>{v.cargo}</p>
                            </div>
                        </div>

                        <div className="vendedor-stats">
                            <div className="stat-item">
                                <label>Meta Mensual</label>
                                <span className="stat-value">
                                    ${getBudgetForUser(v.id).toLocaleString()}
                                </span>
                            </div>
                            <div className="stat-item">
                                <label>Contacto</label>
                                <span className="stat-detail">{v.email}</span>
                                <span className="stat-detail">{v.telefono}</span>
                            </div>
                        </div>

                    </div>
                ))}

                {vendedores.length === 0 && (
                    <div className="card empty-state">
                        <p>No hay asesores comerciales registrados.</p>
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
                }

                .vendedor-avatar {
                    width: 50px;
                    height: 50px;
                    background: var(--primary-blue);
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
