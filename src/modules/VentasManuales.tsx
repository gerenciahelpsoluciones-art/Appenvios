import React, { useState, useMemo } from 'react';
import type { VentaManual, Cliente, AppUser, Producto } from '../App';

interface IProps {
    ventas: VentaManual[];
    clientes: Cliente[];
    productos: Producto[];
    users: AppUser[];
    currentUser: AppUser;
    onAdd: (venta: VentaManual) => void;
    onAddBulk: (ventas: VentaManual[]) => void;
    onUpdate: (venta: VentaManual) => void;
    onDelete: (id: string) => void;
}

const VentasManualesModule: React.FC<IProps> = ({ 
    ventas, clientes, productos, users, currentUser, 
    onAdd, onAddBulk, onUpdate, onDelete 
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingVenta, setEditingVenta] = useState<VentaManual | null>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [salesToClone, setSalesToClone] = useState<string[]>([]);
    
    // Target period for cloning
    const [targetYear, setTargetYear] = useState(new Date().getFullYear());
    const [targetMonth, setTargetMonth] = useState(new Date().getMonth() + 1);

    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [selectedUsuarioId, setSelectedUsuarioId] = useState(currentUser.id);
    const [monto, setMonto] = useState(0);
    const [tipoVenta, setTipoVenta] = useState<'Venta' | 'Contrato' | 'Alquiler' | 'Licencia'>('Venta');
    const [descripcion, setDescripcion] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Summary Calculations
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const currentYearStr = new Date().getFullYear().toString();

    const stats = useMemo(() => {
        const monthSales = ventas.filter(v => v.fecha.startsWith(currentMonthStr));
        const yearSales = ventas.filter(v => v.fecha.startsWith(currentYearStr));
        
        return {
            monthTotal: monthSales.reduce((sum, v) => sum + v.monto, 0),
            monthCount: monthSales.length,
            yearTotal: yearSales.reduce((sum, v) => sum + v.monto, 0),
            totalActiveSellers: new Set(ventas.map(v => v.usuarioId)).size
        };
    }, [ventas, currentMonthStr, currentYearStr]);

    // Group sales by Month/Year for the selector
    const availableMonths = Array.from(new Set(ventas.map(v => v.fecha.substring(0, 7)))).sort().reverse();

    const handleCloneSubmit = () => {
        const selectedSales = ventas.filter(v => salesToClone.includes(v.id));
        const targetDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;

        const clonedItems = selectedSales.map(sale => ({
            ...sale,
            id: crypto.randomUUID(),
            fecha: targetDate,
        }));

        onAddBulk(clonedItems);
        setIsCloning(false);
        setSalesToClone([]);
        setSelectedMonth('');
        alert(`${selectedSales.length} ventas clonadas exitosamente para el periodo ${targetYear}-${targetMonth}.`);
    };

    const handlesubmit = () => {
        const cliente = clientes.find(c => c.id === (editingVenta ? editingVenta.clienteId : selectedClienteId));
        const usuario = users.find(u => u.id === selectedUsuarioId);
        const producto = productos.find(p => p.id === selectedProductoId);

        if ((!cliente && !editingVenta) || !usuario || monto <= 0) {
            alert('Por favor complete todos los campos obligatorios');
            return;
        }

        if (editingVenta) {
            onUpdate({
                ...editingVenta,
                fecha,
                productoId: producto?.id,
                productoNombre: producto ? `${producto.numPart} - ${producto.nombre}` : undefined,
                usuarioId: usuario.id,
                usuarioNombre: usuario.nombre,
                monto,
                descripcion
            });
            setEditingVenta(null);
        } else {
            const newVenta: VentaManual = {
                id: crypto.randomUUID(),
                fecha: fecha,
                clienteId: cliente!.id,
                clienteNombre: cliente!.nombre,
                productoId: producto?.id,
                productoNombre: producto ? `${producto.numPart} - ${producto.nombre}` : undefined,
                usuarioId: usuario.id,
                usuarioNombre: usuario.nombre,
                monto: monto,
                tipoVenta: tipoVenta,
                descripcion: descripcion
            };
            onAdd(newVenta);
        }
        resetForm();
    };

    const startEdit = (v: VentaManual) => {
        setEditingVenta(v);
        setFecha(v.fecha);
        setSelectedProductoId(v.productoId || '');
        setSelectedUsuarioId(v.usuarioId);
        setMonto(v.monto);
        setTipoVenta(v.tipoVenta || 'Venta');
        setDescripcion(v.descripcion);
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingVenta(null);
        setFecha(new Date().toISOString().split('T')[0]);
        setSelectedClienteId('');
        setSelectedProductoId('');
        setSelectedUsuarioId(currentUser.id);
        setMonto(0);
        setTipoVenta('Venta');
        setDescripcion('');
    };

    const filteredVentas = useMemo(() => {
        let base = currentUser.rol === 'Admin'
            ? ventas
            : ventas.filter(v => v.usuarioId === currentUser.id);
            
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            base = base.filter(v => 
                v.clienteNombre.toLowerCase().includes(lowSearch) || 
                v.descripcion.toLowerCase().includes(lowSearch) ||
                (v.productoNombre && v.productoNombre.toLowerCase().includes(lowSearch))
            );
        }
        return base.sort((a, b) => b.fecha.localeCompare(a.fecha));
    }, [ventas, currentUser, searchTerm]);

    return (
        <div className="module-container">
            <div className="module-header">
                <div>
                    <h2>Ventas Manuales</h2>
                    <p>Gestión de ingresos directos y facturación recurrente</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" onClick={() => setIsCloning(true)}>🔄 Facturación Recurrente</button>
                    <button className="btn-primary" onClick={() => setIsAdding(true)}>+ Registrar Ingreso</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card animate-fade-in">
                    <span className="stat-icon">💰</span>
                    <div className="stat-info">
                        <span className="stat-label">Ingresos del Mes</span>
                        <span className="stat-value">${stats.monthTotal.toLocaleString()}</span>
                        <span className="stat-sub">{stats.monthCount} ventas registradas</span>
                    </div>
                </div>
                <div className="stat-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <span className="stat-icon">📅</span>
                    <div className="stat-info">
                        <span className="stat-label">Ingresos Anuales</span>
                        <span className="stat-value">${stats.yearTotal.toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <span className="stat-icon">👥</span>
                    <div className="stat-info">
                        <span className="stat-label">Comerciales Activos</span>
                        <span className="stat-value">{stats.totalActiveSellers}</span>
                    </div>
                </div>
            </div>

            {isAdding && (
                <div className="card form-card animate-fade-in" style={{ marginBottom: '2rem', borderTop: '4px solid var(--primary-blue)' }}>
                    <h3>{editingVenta ? 'Editar Venta' : 'Registrar Nueva Venta'}</h3>
                    <div className="form-grid-modern">
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Fecha de Operación</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                />
                            </div>
                            <div className="form-group flex-2">
                                <label>Cliente</label>
                                <select
                                    className="input-field"
                                    value={editingVenta ? editingVenta.clienteId : selectedClienteId}
                                    onChange={e => setSelectedClienteId(e.target.value)}
                                    disabled={!!editingVenta}
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} (NIT: {c.nit})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label>Servicio / Producto (Opcional)</label>
                                <select
                                    className="input-field"
                                    value={selectedProductoId}
                                    onChange={e => setSelectedProductoId(e.target.value)}
                                >
                                    <option value="">Ninguno / Otro / Manual</option>
                                    {productos.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.moneda === 'USD' ? '🇺🇸' : '🇨🇴'} {p.nombre} {p.numPart ? `(N/P: ${p.numPart})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label>Monto Bruto (COP)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={monto}
                                    onChange={e => setMonto(Number(e.target.value))}
                                    placeholder="0"
                                    style={{ fontWeight: 'bold', fontSize: '1.1rem' }}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Tipo de Venta</label>
                                <select
                                    className="input-field"
                                    value={tipoVenta}
                                    onChange={e => setTipoVenta(e.target.value as any)}
                                >
                                    <option value="Venta">Venta Estándar</option>
                                    <option value="Contrato">Contrato de Mantenimiento</option>
                                    <option value="Alquiler">Alquiler de Equipos</option>
                                    <option value="Licencia">Licenciamiento / Software</option>
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label>Asesor comercial encargado</label>
                                <select
                                    className="input-field"
                                    value={selectedUsuarioId}
                                    onChange={e => setSelectedUsuarioId(e.target.value)}
                                    disabled={currentUser.rol !== 'Admin'}
                                >
                                    {users
                                        .filter(u => {
                                            const rol = (u.rol || '').toLowerCase();
                                            const cargo = (u.cargo || '').toLowerCase();
                                            const isExcluded = rol.includes('tecnico') || rol.includes('técnico') || rol.includes('logistica') || rol.includes('logística');
                                            
                                            return !isExcluded && (
                                                rol === 'comercial' || 
                                                rol === 'admin' || 
                                                cargo.includes('comercial') || 
                                                cargo.includes('gerente') ||
                                                cargo.includes('asesor')
                                            );
                                        })
                                        .map(u => (
                                            <option key={u.id} value={u.id}>{u.nombre}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Concepto de Facturación / Notas</label>
                            <textarea
                                className="input-field"
                                style={{ height: '80px', resize: 'vertical' }}
                                value={descripcion}
                                onChange={e => setDescripcion(e.target.value)}
                                placeholder="Ej: Pago mensual soporte help desk, renovación licencias, etc."
                            />
                        </div>

                        <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="btn-secondary" onClick={resetForm}>Cerrar</button>
                            <button className="btn-primary" onClick={handlesubmit}>
                                {editingVenta ? 'Guardar Cambios' : 'Registrar Venta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCloning && (
                <div className="card form-card animate-fade-in" style={{ marginBottom: '2rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0, color: '#0f172a' }}>Periodo de Facturación Recurrente</h3>
                            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Seleccione paso a paso las facturas que desea repetir para el nuevo periodo</p>
                        </div>
                        <button className="btn-action" onClick={() => setIsCloning(false)} style={{ background: '#e2e8f0' }}>✖</button>
                    </div>

                    <div className="form-grid-modern" style={{ marginBottom: '2rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>1. Seleccionar Mes Origen</label>
                                <select 
                                    className="input-field" 
                                    value={selectedMonth}
                                    onChange={(e) => {
                                        setSelectedMonth(e.target.value);
                                        setSalesToClone([]); // Reset selection when month changes
                                    }}
                                >
                                    <option value="">Seleccione Periodo...</option>
                                    {availableMonths.map(m => (
                                        <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label>2. Nuevo Año Destino</label>
                                <input type="number" className="input-field" value={targetYear} onChange={e => setTargetYear(Number(e.target.value))} />
                            </div>
                            <div className="form-group flex-1">
                                <label>3. Nuevo Mes Destino</label>
                                <select className="input-field" value={targetMonth} onChange={e => setTargetMonth(Number(e.target.value))}>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{new Date(2000, m - 1).toLocaleDateString('es-ES', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {selectedMonth && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                                <div style={{ position: 'relative', width: '300px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar ventas del mes..." 
                                        className="input-field" 
                                        style={{ paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>
                                    Confirmado para clonar: <span style={{ color: 'var(--primary-blue)', fontSize: '1.1rem', fontWeight: '700' }}>
                                        ${ventas.filter(v => salesToClone.includes(v.id)).reduce((s, v) => s + v.monto, 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.05)' }}>
                                <table className="data-table" style={{ fontSize: '0.9rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10 }}>
                                        <tr>
                                            <th style={{ width: '40px' }}> 
                                                 {/* Checkbox global removed to avoid "import all" accidents */}
                                            </th>
                                            <th>Cliente</th>
                                            <th>Concepto</th>
                                            <th className="text-right">Monto Original</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ventas
                                            .filter(v => v.fecha.startsWith(selectedMonth))
                                            .filter(v => 
                                                !searchTerm || 
                                                v.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                v.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .map(v => (
                                            <tr key={v.id} style={{ cursor: 'pointer', backgroundColor: salesToClone.includes(v.id) ? '#f0f9ff' : 'transparent' }} onClick={() => {
                                                if (salesToClone.includes(v.id)) setSalesToClone(salesToClone.filter(id => id !== v.id));
                                                else setSalesToClone([...salesToClone, v.id]);
                                            }}>
                                                <td>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={salesToClone.includes(v.id)}
                                                        readOnly
                                                        style={{ transform: 'scale(1.2)' }}
                                                    />
                                                </td>
                                                <td><strong>{v.clienteNombre}</strong></td>
                                                <td>{v.descripcion}</td>
                                                <td className="text-right">${v.monto.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => { setIsCloning(false); setSalesToClone([]); setSelectedMonth(''); }}>Cancelar</button>
                        <button 
                            className="btn-primary" 
                            disabled={salesToClone.length === 0} 
                            onClick={handleCloneSubmit}
                            style={{ background: 'var(--success)' }}
                        >
                            Confirmar Selección ({salesToClone.length} items)
                        </button>
                    </div>
                </div>
            )}

            <div className="card table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>Historial de Operaciones</h3>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente, producto o descripción..." 
                            className="input-field" 
                            style={{ paddingLeft: '2.5rem' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    </div>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Producto / Detalle</th>
                                <th>Responsable</th>
                                <th>Descripción</th>
                                <th className="text-right">Monto</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVentas.map(v => (
                                <tr key={v.id}>
                                    <td>{v.fecha}</td>
                                    <td><strong>{v.clienteNombre}</strong></td>
                                    <td>
                                        {v.productoNombre ? (
                                            <span className="badge badge-info">{v.productoNombre}</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>Otros Ingresos</span>
                                        )}
                                    </td>
                                    <td>{v.usuarioNombre}</td>
                                    <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>{v.descripcion}</td>
                                    <td className="text-right" style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                                        ${v.monto.toLocaleString()}
                                    </td>
                                    <td className="text-center">
                                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                            <button className="btn-action" onClick={() => startEdit(v)}>✏️</button>
                                            <button
                                                className="btn-action"
                                                style={{ color: 'var(--error)' }}
                                                onClick={() => {
                                                    if (window.confirm('¿Está seguro de eliminar este registro de venta?')) {
                                                        onDelete(v.id);
                                                    }
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredVentas.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                                        No se encontraron registros de ventas manuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VentasManualesModule;
