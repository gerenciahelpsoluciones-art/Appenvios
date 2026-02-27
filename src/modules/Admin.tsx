import React, { useState } from 'react';
import type { AppUser, SalesBudget } from '../App';

interface IProps {
    users: AppUser[];
    currentUser: AppUser;
    onAdd: (u: AppUser) => void;
    onUpdate: (u: AppUser) => void;
    onDelete: (id: string) => void;
    onSwitchUser: (u: AppUser) => void;
    budgets: SalesBudget[];
    onAddBudget: (b: SalesBudget) => void;
    onUpdateBudget: (b: SalesBudget) => void;
    onDeleteBudget: (id: string) => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const MODULES = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'cotizaciones', label: 'Cotizaciones' },
    { id: 'ordenes-compra', label: 'Ordenes de Compra' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'productos', label: 'Productos' },
    { id: 'proveedores', label: 'Proveedores' },
    { id: 'conductores', label: 'Conductores' },
    { id: 'logistica', label: 'Logística' },
    { id: 'reparaciones', label: 'Reparaciones' },
    { id: 'informes', label: 'Informes' },
    { id: 'admin', label: 'Administración' },
    { id: 'vendedores', label: 'Vendedores' },
];

const AdminModule: React.FC<IProps> = ({
    users,
    currentUser,
    onAdd,
    onUpdate,
    onDelete,
    onSwitchUser,
    budgets,
    onAddBudget,
    onUpdateBudget,
    onDeleteBudget
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'users' | 'budgets'>('users');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<AppUser>>({
        rol: 'Comercial',
        permisos: ['dashboard']
    });

    const [budgetForm, setBudgetForm] = useState({
        usuarioId: '',
        anio: new Date().getFullYear(),
        mes: new Date().getMonth(),
        monto: 0
    });

    const handleSave = () => {
        if (formData.nombre && formData.usuario) {
            const userData = {
                ...formData,
                permisos: formData.permisos || ['dashboard']
            } as AppUser;

            if (editingId) {
                onUpdate({ ...userData, id: editingId });
                setEditingId(null);
            } else {
                onAdd({ ...userData, id: Date.now().toString() });
                setIsAdding(false);
            }
            setFormData({ rol: 'Comercial', permisos: ['dashboard'] });
        } else {
            alert('Por favor complete Nombre y Usuario');
        }
    };

    const togglePermission = (moduleId: string) => {
        const currentPerms = formData.permisos || [];
        if (currentPerms.includes(moduleId)) {
            setFormData({ ...formData, permisos: currentPerms.filter((id: string) => id !== moduleId) });
        } else {
            setFormData({ ...formData, permisos: [...currentPerms, moduleId] });
        }
    };

    const startEdit = (u: AppUser) => {
        setFormData(u);
        setEditingId(u.id);
        setIsAdding(false);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ rol: 'Comercial', permisos: ['dashboard'] });
        setBudgetForm({ usuarioId: '', anio: new Date().getFullYear(), mes: new Date().getMonth(), monto: 0 });
    };

    const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

    const handleSaveBudget = () => {
        if (!budgetForm.usuarioId || budgetForm.monto <= 0) {
            alert('Seleccione un vendedor y defina un monto válido');
            return;
        }
        const vendor = users.find(u => u.id === budgetForm.usuarioId);

        if (editingBudgetId) {
            onUpdateBudget({
                ...budgetForm,
                id: editingBudgetId,
                nombreVendedor: vendor?.nombre || 'N/A'
            });
            setEditingBudgetId(null);
        } else {
            onAddBudget({
                ...budgetForm,
                id: Date.now().toString(),
                nombreVendedor: vendor?.nombre || 'N/A'
            });
        }
        setBudgetForm({ usuarioId: '', anio: new Date().getFullYear(), mes: new Date().getMonth(), monto: 0 });
    };

    return (
        <div className="module-container">
            <div className="admin-tabs">
                <button
                    className={`admin-tab-btn ${activeSubTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('users')}
                >
                    Usuarios y Permisos
                </button>
                <button
                    className={`admin-tab-btn ${activeSubTab === 'budgets' ? 'active' : ''}`}
                    onClick={() => setActiveSubTab('budgets')}
                >
                    Presupuestos de Ventas
                </button>
            </div>

            {activeSubTab === 'users' ? (
                <>
                    <div className="module-header" style={{ marginTop: '1rem' }}>
                        <h2>Gestión de Usuarios</h2>
                        <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ rol: 'Comercial', permisos: ['dashboard'] }); }}>+ Nuevo Usuario</button>
                    </div>
                    {/* Existing User form and table logic */}

                    {(isAdding || editingId) && (
                        <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                            <h3>{editingId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nombre Completo</label>
                                    <input className="input-field" value={formData.nombre || ''} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Usuario (Login)</label>
                                    <input className="input-field" value={formData.usuario || ''} onChange={e => setFormData({ ...formData, usuario: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Cargo</label>
                                    <input className="input-field" value={formData.cargo || ''} onChange={e => setFormData({ ...formData, cargo: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input className="input-field" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Teléfono</label>
                                    <input className="input-field" value={formData.telefono || ''} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Rol</label>
                                    <select className="input-field" value={formData.rol} onChange={e => setFormData({ ...formData, rol: e.target.value as any })}>
                                        <option value="Admin">Administrador</option>
                                        <option value="Comercial">Comercial</option>
                                        <option value="Logistica">Logística</option>
                                        <option value="Tecnico">Técnico</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Contraseña</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={formData.password || ''}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <h4>Delegar Permisos (Acceso a Módulos)</h4>
                                <div className="permissions-grid">
                                    {MODULES.map(m => (
                                        <label key={m.id} className="permission-item">
                                            <input
                                                type="checkbox"
                                                checked={formData.permisos?.includes(m.id)}
                                                onChange={() => togglePermission(m.id)}
                                            />
                                            <span>{m.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                <button onClick={handleSave} className="btn-success">Guardar Usuario</button>
                                <button className="btn-secondary" onClick={cancel}>Cancelar</button>
                            </div>
                        </div>
                    )}

                    <div className="card table-card animate-fade-in">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Usuario</th>
                                    <th>Rol / Cargo</th>
                                    <th>Permisos</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ opacity: currentUser.id === u.id ? 1 : 0.8 }}>
                                        <td>
                                            <strong>{u.nombre}</strong>
                                            {u.id === currentUser.id && <span className="current-user-badge">Actual</span>}
                                        </td>
                                        <td><code>{u.usuario}</code></td>
                                        <td>
                                            <span className={`rol-tag rol-${u.rol.toLowerCase()}`}>{u.rol}</span>
                                            <br /><small>{u.cargo}</small>
                                        </td>
                                        <td>
                                            <div className="perms-summary">
                                                {u.permisos.length} módulos asignados
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                <button className="btn-switch" onClick={() => onSwitchUser(u)} title="Cambiar a este usuario">👤</button>
                                                <button className="btn-edit" onClick={() => startEdit(u)} title="Editar">✏️</button>
                                                <button className="btn-delete-icon" onClick={() => onDelete(u.id)} title="Eliminar">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div style={{ marginTop: '1rem' }}>
                    <div className="module-header">
                        <h2>Metas de Ventas por Comercial</h2>
                    </div>

                    <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                        <h3>Asignar Nuevo Presupuesto</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Vendedor</label>
                                <select className="input-field" value={budgetForm.usuarioId} onChange={e => setBudgetForm({ ...budgetForm, usuarioId: e.target.value })}>
                                    <option value="">Seleccione...</option>
                                    {users.filter(u => u.rol === 'Comercial').map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Año</label>
                                <input type="number" className="input-field" value={budgetForm.anio} onChange={e => setBudgetForm({ ...budgetForm, anio: Number(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label>Mes</label>
                                <select className="input-field" value={budgetForm.mes} onChange={e => setBudgetForm({ ...budgetForm, mes: Number(e.target.value) })}>
                                    {MONTHS.map((m, idx) => (
                                        <option key={m} value={idx}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Monto Presupuestado ($)</label>
                                <input type="number" className="input-field" value={budgetForm.monto} onChange={e => setBudgetForm({ ...budgetForm, monto: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="form-actions" style={{ marginTop: '1rem' }}>
                            <button className="btn-success" onClick={handleSaveBudget}>Guardar Presupuesto</button>
                        </div>
                    </div>

                    <div className="card table-card animate-fade-in">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Vendedor</th>
                                    <th>Periodo</th>
                                    <th className="text-right">Monto</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgets.map(b => (
                                    <tr key={b.id}>
                                        <td><strong>{b.nombreVendedor}</strong></td>
                                        <td>{MONTHS[b.mes]} {b.anio}</td>
                                        <td className="text-right">${b.monto.toLocaleString()}</td>
                                        <td className="text-center">
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                <button className="btn-edit" onClick={() => {
                                                    setEditingBudgetId(b.id);
                                                    setBudgetForm({
                                                        usuarioId: b.usuarioId,
                                                        anio: b.anio,
                                                        mes: b.mes,
                                                        monto: b.monto
                                                    });
                                                }} title="Editar">✏️</button>
                                                <button className="btn-delete-icon" onClick={() => onDeleteBudget(b.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {budgets.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No hay presupuestos asignados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style>{`
                .admin-tabs {
                    display: flex;
                    gap: 1rem;
                    border-bottom: 2px solid #e2e8f0;
                    margin-bottom: 1.5rem;
                }
                .admin-tab-btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: none;
                    cursor: pointer;
                    font-weight: 600;
                    color: var(--text-muted);
                    transition: border-bottom 0.2s, color 0.2s;
                    border-bottom: 3px solid transparent;
                }
                .admin-tab-btn.active {
                    color: var(--primary-blue);
                    border-bottom-color: var(--primary-blue);
                }
                .admin-tab-btn:hover {
                    color: var(--primary-blue);
                }

                .permissions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 0.8rem;
                    margin-top: 1rem;
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .permission-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    font-size: 0.9rem;
                    padding: 0.4rem;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                .permission-item:hover { background: #f1f5f9; }
                .permission-item input { width: 1.1rem; height: 1.1rem; cursor: pointer; }

                .current-user-badge {
                    background: #dcfce7;
                    color: #15803d;
                    font-size: 0.65rem;
                    padding: 0.1rem 0.4rem;
                    border-radius: 10px;
                    margin-left: 0.5rem;
                    font-weight: bold;
                    border: 1px solid #bbf7d0;
                }

                .rol-tag {
                    font-size: 0.75rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    font-weight: bold;
                }
                .rol-admin { background: #fee2e2; color: #991b1b; }
                .rol-comercial { background: #e0f2fe; color: #0369a1; }
                .rol-logistica { background: #fef3c7; color: #92400e; }
                .rol-tecnico { background: #f3e8ff; color: #6b21a8; }

                .btn-switch {
                    background: #f0fdf4;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                    padding: 0.3rem 0.6rem;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .btn-switch:hover { background: #dcfce7; }
                .perms-summary { font-size: 0.8rem; color: var(--text-muted); }
            `}</style>
        </div>
    );
};

export default AdminModule;
