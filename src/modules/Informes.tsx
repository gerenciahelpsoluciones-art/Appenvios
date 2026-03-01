import React, { useState } from 'react';
import type { Cotizacion, SalesBudget, AppUser, Cliente, Producto, Proveedor } from '../App';

interface IProps {
    cotizaciones: Cotizacion[];
    budgets: SalesBudget[];
    currentUser: AppUser;
    onUpdateQuote: (quote: Cotizacion) => void;
    clientes: Cliente[];
    productos: Producto[];
    proveedores: Proveedor[];
}

interface EditItem {
    id: string;
    productoId: string;
    proveedorId: string;
    unidad: string;
    cantidad: number;
    costoUnitario: number;
    utilidad: number;
    iva: number;
}

const InformesModule: React.FC<IProps> = ({ cotizaciones, budgets, currentUser, onUpdateQuote, clientes, productos, proveedores }) => {
    const today = new Date().toISOString().split('T')[0];
    const [fechaInicio, setFechaInicio] = useState(today);
    const [fechaFin, setFechaFin] = useState(today);

    // Month for budget comparison
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // State for dates that are actually being used for filtering
    const [appliedDates, setAppliedDates] = useState({ inicio: today, fin: today });

    // Edit modal state
    const [editingQuote, setEditingQuote] = useState<Cotizacion | null>(null);
    const [editItems, setEditItems] = useState<EditItem[]>([]);
    const [editClienteId, setEditClienteId] = useState('');

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

    // --- Edit Modal Helpers ---
    const openEditModal = (q: Cotizacion) => {
        setEditingQuote(q);
        setEditClienteId(q.clienteId);
        setEditItems((q.items || []).map(item => ({
            id: item.id,
            productoId: item.productoId,
            proveedorId: item.proveedorId,
            unidad: item.unidad,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            utilidad: item.utilidad,
            iva: item.iva,
        })));
    };

    const closeEditModal = () => {
        setEditingQuote(null);
        setEditItems([]);
        setEditClienteId('');
    };

    const updateEditItem = (id: string, field: keyof EditItem, value: any) => {
        setEditItems(prev => prev.map(item => {
            if (item.id === id) {
                if (field === 'productoId') {
                    const prod = productos.find(p => p.id === value);
                    return { ...item, productoId: value, costoUnitario: prod?.precioCompra || 0, unidad: prod?.unidad || 'Und' };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const addEditItem = () => {
        setEditItems(prev => [...prev, {
            id: Date.now().toString(),
            productoId: '',
            proveedorId: '',
            unidad: 'Und',
            cantidad: 1,
            costoUnitario: 0,
            utilidad: 15,
            iva: 19,
        }]);
    };

    const removeEditItem = (id: string) => {
        setEditItems(prev => prev.filter(i => i.id !== id));
    };

    const calcVenta = (item: EditItem) => item.costoUnitario * (1 + item.utilidad / 100);
    const calcSubtotal = (item: EditItem) => calcVenta(item) * item.cantidad;
    const calcIVA = (item: EditItem) => calcSubtotal(item) * (item.iva / 100);
    const calcTotal = (item: EditItem) => calcSubtotal(item) + calcIVA(item);

    const editSubtotal = editItems.reduce((acc, i) => acc + calcSubtotal(i), 0);
    const editIVATotal = editItems.reduce((acc, i) => acc + calcIVA(i), 0);
    const editGrandTotal = editSubtotal + editIVATotal;

    const saveEdit = () => {
        if (!editingQuote) return;
        const cliente = clientes.find(c => c.id === editClienteId);
        const updated: Cotizacion = {
            ...editingQuote,
            clienteId: editClienteId,
            clienteNombre: cliente?.nombre || editingQuote.clienteNombre,
            items: editItems.map(i => ({
                id: i.id,
                productoId: i.productoId,
                proveedorId: i.proveedorId,
                unidad: i.unidad,
                cantidad: i.cantidad,
                costoUnitario: i.costoUnitario,
                utilidad: i.utilidad,
                iva: i.iva,
            })),
            subtotal: editSubtotal,
            iva: editIVATotal,
            total: editGrandTotal,
        };
        onUpdateQuote(updated);
        closeEditModal();
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
                                <th className="text-center" style={{ minWidth: '180px' }}>Acciones</th>
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
                                                    className="btn-status btn-edit-quote"
                                                    onClick={() => openEditModal(q)}
                                                    title="Editar Cotización"
                                                >
                                                    ✏️
                                                </button>
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
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No se encontraron cotizaciones en este rango de fechas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========== EDIT MODAL ========== */}
            {editingQuote && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>✏️ Editar Cotización {editingQuote.consecutivo}</h3>
                            <button className="modal-close" onClick={closeEditModal}>×</button>
                        </div>

                        <div className="modal-body">
                            {/* Client selector */}
                            <div className="edit-section">
                                <label className="edit-label">Cliente</label>
                                <select className="edit-select" value={editClienteId} onChange={e => setEditClienteId(e.target.value)}>
                                    <option value="">-- Seleccionar Cliente --</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} (NIT: {c.nit})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Items table */}
                            <div className="edit-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <label className="edit-label" style={{ margin: 0 }}>Items</label>
                                    <button className="btn-add-item" onClick={addEditItem}>+ Añadir Item</button>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="edit-table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Proveedor</th>
                                                <th style={{ width: '65px' }}>Cant</th>
                                                <th style={{ width: '90px' }}>Costo</th>
                                                <th style={{ width: '60px' }}>Util%</th>
                                                <th style={{ width: '60px' }}>IVA%</th>
                                                <th>Venta</th>
                                                <th>Total</th>
                                                <th style={{ width: '40px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editItems.map(item => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <select className="edit-input" value={item.productoId} onChange={e => updateEditItem(item.id, 'productoId', e.target.value)}>
                                                            <option value="">-- Producto --</option>
                                                            {productos.map(p => (
                                                                <option key={p.id} value={p.id}>{p.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <select className="edit-input" value={item.proveedorId} onChange={e => updateEditItem(item.id, 'proveedorId', e.target.value)}>
                                                            <option value="">-- Prov --</option>
                                                            {proveedores.map(p => (
                                                                <option key={p.id} value={p.id}>{p.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td><input className="edit-input num" type="number" value={item.cantidad} onChange={e => updateEditItem(item.id, 'cantidad', Number(e.target.value))} /></td>
                                                    <td><input className="edit-input num" type="number" value={item.costoUnitario} onChange={e => updateEditItem(item.id, 'costoUnitario', Number(e.target.value))} /></td>
                                                    <td><input className="edit-input num" type="number" value={item.utilidad} onChange={e => updateEditItem(item.id, 'utilidad', Number(e.target.value))} /></td>
                                                    <td><input className="edit-input num" type="number" value={item.iva} onChange={e => updateEditItem(item.id, 'iva', Number(e.target.value))} /></td>
                                                    <td className="ro">${calcVenta(item).toLocaleString()}</td>
                                                    <td className="ro bold">${calcTotal(item).toLocaleString()}</td>
                                                    <td><button className="btn-remove-item" onClick={() => removeEditItem(item.id)}>×</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="edit-totals">
                                <div className="total-row"><span>Subtotal:</span><span>${editSubtotal.toLocaleString()}</span></div>
                                <div className="total-row"><span>IVA:</span><span>${editIVATotal.toLocaleString()}</span></div>
                                <div className="total-row grand"><span>TOTAL:</span><span>${editGrandTotal.toLocaleString()}</span></div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={closeEditModal}>Cancelar</button>
                            <button className="btn-save" onClick={saveEdit} disabled={editItems.length === 0}>💾 Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}

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
                    font-family: 'Courier New', Courier, monospace;
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
                    justify-content: center;
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
                .btn-edit-quote { font-size: 1rem; }
                .btn-edit-quote:hover { background: #dbeafe !important; }

                /* ---- Edit Modal ---- */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                .modal-content {
                    background: white;
                    border-radius: 16px;
                    width: 90vw;
                    max-width: 1000px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                    animation: slideUp 0.3s ease;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    background: linear-gradient(135deg, #004a99 0%, #0066cc 100%);
                    color: white;
                    border-radius: 16px 16px 0 0;
                }
                .modal-header h3 { margin: 0; font-size: 1.1rem; }
                .modal-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    font-size: 1.4rem;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                .modal-close:hover { background: rgba(255,255,255,0.35); }
                .modal-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--border-color);
                    background: #f9fafb;
                    border-radius: 0 0 16px 16px;
                }
                .edit-section {
                    margin-bottom: 1.25rem;
                }
                .edit-label {
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                    display: block;
                    color: #374151;
                }
                .edit-select {
                    width: 100%;
                    padding: 0.6rem;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 0.9rem;
                }
                .edit-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                }
                .edit-table th {
                    background: #f1f5f9;
                    padding: 0.5rem;
                    text-align: left;
                    font-weight: 600;
                    font-size: 0.78rem;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                }
                .edit-table td {
                    padding: 0.35rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .edit-input {
                    width: 100%;
                    padding: 0.35rem 0.4rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    transition: border 0.2s;
                }
                .edit-input:focus {
                    border-color: #3b82f6;
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
                }
                .edit-input.num { text-align: right; width: 100%; }
                .ro { text-align: right; color: #6b7280; font-size: 0.85rem; padding: 0.35rem 0.5rem !important; }
                .bold { font-weight: 700; color: #111827; }
                .btn-add-item {
                    background: #dbeafe;
                    color: #1d4ed8;
                    border: none;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.8rem;
                    transition: background 0.2s;
                }
                .btn-add-item:hover { background: #bfdbfe; }
                .btn-remove-item {
                    background: none;
                    border: none;
                    color: #ef4444;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }
                .btn-remove-item:hover { color: #b91c1c; }

                .edit-totals {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.35rem;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e2e8f0;
                }
                .total-row {
                    display: flex;
                    gap: 2rem;
                    font-size: 0.9rem;
                    color: #6b7280;
                }
                .total-row span:last-child { font-weight: 600; min-width: 120px; text-align: right; }
                .total-row.grand {
                    font-size: 1.1rem;
                    color: #004a99;
                    font-weight: 800;
                    margin-top: 0.25rem;
                    padding-top: 0.5rem;
                    border-top: 2px solid #004a99;
                }
                .btn-cancel {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                    padding: 0.6rem 1.25rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }
                .btn-cancel:hover { background: #e5e7eb; }
                .btn-save {
                    background: linear-gradient(135deg, #004a99, #0066cc);
                    color: white;
                    border: none;
                    padding: 0.6rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: transform 0.15s, box-shadow 0.15s;
                }
                .btn-save:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,74,153,0.3); }
                .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
            `}</style>
        </div>
    );
};

export default InformesModule;
