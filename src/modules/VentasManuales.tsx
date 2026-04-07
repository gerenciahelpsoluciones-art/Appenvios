import React, { useState } from 'react';
import type { VentaManual, Cliente, AppUser, Producto } from '../App';

interface IProps {
    ventas: VentaManual[];
    clientes: Cliente[];
    productos: Producto[];
    users: AppUser[];
    currentUser: AppUser;
    onAdd: (venta: VentaManual) => void;
    onDelete: (id: string) => void;
}

const VentasManualesModule: React.FC<IProps> = ({ ventas, clientes, productos, users, currentUser, onAdd, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [salesToClone, setSalesToClone] = useState<string[]>([]);

    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [selectedUsuarioId, setSelectedUsuarioId] = useState(currentUser.id);
    const [monto, setMonto] = useState(0);
    const [descripcion, setDescripcion] = useState('');

    // Group sales by Month/Year for the selector
    const availableMonths = Array.from(new Set(ventas.map(v => v.fecha.substring(0, 7)))).sort().reverse();

    const handleCloneSubmit = () => {
        const selectedSales = ventas.filter(v => salesToClone.includes(v.id));
        const today = new Date().toISOString().split('T')[0];

        selectedSales.forEach(sale => {
            const clonedVenta: VentaManual = {
                ...sale,
                id: crypto.randomUUID(),
                fecha: today,
            };
            onAdd(clonedVenta);
        });

        setIsCloning(false);
        setSalesToClone([]);
        setSelectedMonth('');
        alert(`${selectedSales.length} ventas clonadas exitosamente para hoy.`);
    };

    const handlesubmit = () => {
        const cliente = clientes.find(c => c.id === selectedClienteId);
        const usuario = users.find(u => u.id === selectedUsuarioId);
        const producto = productos.find(p => p.id === selectedProductoId);

        if (!cliente || !usuario || monto <= 0) {
            alert('Por favor complete todos los campos obligatorios y asegúrese de que el monto sea mayor a 0');
            return;
        }

        const newVenta: VentaManual = {
            id: crypto.randomUUID(),
            fecha: fecha,
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            productoId: producto?.id,
            productoNombre: producto ? `${producto.numPart} - ${producto.nombre}` : undefined,
            usuarioId: usuario.id,
            usuarioNombre: usuario.nombre,
            monto: monto,
            descripcion: descripcion
        };

        onAdd(newVenta);
        resetForm();
    };

    const resetForm = () => {
        setIsAdding(false);
        setFecha(new Date().toISOString().split('T')[0]);
        setSelectedClienteId('');
        setSelectedProductoId('');
        setSelectedUsuarioId(currentUser.id);
        setMonto(0);
        setDescripcion('');
    };

    // Filter sales based on user role (Admins see all, Comercials see theirs)
    const filteredVentas = currentUser.rol === 'Admin'
        ? ventas
        : ventas.filter(v => v.usuarioId === currentUser.id);

    return (
        <div className="module-container">
            <div className="module-header">
                <div>
                    <h2>Ventas Manuales</h2>
                    <p>Registro de ventas directas sin cotización previa</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" onClick={() => setIsCloning(true)}>🔄 Importar Facturación</button>
                    <button className="btn-primary" onClick={() => setIsAdding(true)}>+ Registrar Venta</button>
                </div>
            </div>

            {isAdding && (
                <div className="card form-card animate-fade-in" style={{ marginBottom: '2rem' }}>
                    <h3>Registrar Nueva Venta</h3>
                    <div className="form-grid-modern">
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Fecha de Venta</label>
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
                                    value={selectedClienteId}
                                    onChange={e => setSelectedClienteId(e.target.value)}
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
                                <label>Producto Asociado (Opcional)</label>
                                <select
                                    className="input-field"
                                    value={selectedProductoId}
                                    onChange={e => setSelectedProductoId(e.target.value)}
                                >
                                    <option value="">Ninguno / Otro</option>
                                    {productos.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.moneda === 'USD' ? '🇺🇸' : '🇨🇴'} {p.nombre} {p.numPart ? `(N/P: ${p.numPart})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label>Vendedor responsable</label>
                                <select
                                    className="input-field"
                                    value={selectedUsuarioId}
                                    onChange={e => setSelectedUsuarioId(e.target.value)}
                                    disabled={currentUser.rol !== 'Admin'}
                                >
                                    {users.filter(u => u.rol === 'Comercial' || (u.cargo && u.cargo.toLowerCase().includes('comercial')) || u.rol === 'Admin').map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label>Monto Total (COP)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={monto}
                                    onChange={e => setMonto(Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Descripción / Concepto</label>
                            <textarea
                                className="input-field"
                                style={{ height: '80px', resize: 'vertical' }}
                                value={descripcion}
                                onChange={e => setDescripcion(e.target.value)}
                                placeholder="Ej: Venta de consumibles, servicios de soporte express, etc."
                            />
                        </div>

                        <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="btn-secondary" onClick={resetForm}>Cancelar</button>
                            <button className="btn-primary" onClick={handlesubmit}>Guardar Venta</button>
                        </div>
                    </div>
                </div>
            )}

            {isCloning && (
                <div className="card form-card animate-fade-in" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary-blue)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>Importar Ventas Históricas</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Seleccione un periodo para duplicar facturas con la fecha de hoy</p>
                        </div>
                        <select 
                            className="input-field" 
                            style={{ maxWidth: '200px' }}
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <option value="">Seleccione Mes</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{m} (Ventas: {ventas.filter(v => v.fecha.startsWith(m)).length})</option>
                            ))}
                        </select>
                    </div>

                    {selectedMonth && (
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <table className="data-table" style={{ fontSize: '0.9rem' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input 
                                                type="checkbox" 
                                                onChange={(e) => {
                                                    const monthSalesIds = ventas.filter(v => v.fecha.startsWith(selectedMonth)).map(v => v.id);
                                                    setSalesToClone(e.target.checked ? monthSalesIds : []);
                                                }}
                                            />
                                        </th>
                                        <th>Cliente</th>
                                        <th>Descripción</th>
                                        <th className="text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ventas.filter(v => v.fecha.startsWith(selectedMonth)).map(v => (
                                        <tr key={v.id}>
                                            <td>
                                                <input 
                                                    type="checkbox" 
                                                    checked={salesToClone.includes(v.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSalesToClone([...salesToClone, v.id]);
                                                        else setSalesToClone(salesToClone.filter(id => id !== v.id));
                                                    }}
                                                />
                                            </td>
                                            <td>{v.clienteNombre}</td>
                                            <td>{v.descripcion}</td>
                                            <td className="text-right">${v.monto.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => { setIsCloning(false); setSalesToClone([]); setSelectedMonth(''); }}>Cancelar</button>
                        <button 
                            className="btn-primary" 
                            disabled={salesToClone.length === 0} 
                            onClick={handleCloneSubmit}
                        >
                            Clonar Seleccionados ({salesToClone.length})
                        </button>
                    </div>
                </div>
            )}

            <div className="card table-card">
                <h3>Historial de Ventas Manuales</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Producto / Detalle</th>
                                <th>Vendedor</th>
                                <th>Descripción</th>
                                <th className="text-right">Monto</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVentas.sort((a, b) => b.fecha.localeCompare(a.fecha)).map(v => (
                                <tr key={v.id}>
                                    <td>{v.fecha}</td>
                                    <td><strong>{v.clienteNombre}</strong></td>
                                    <td>
                                        {v.productoNombre ? (
                                            <span style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
                                                {v.productoNombre}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>Múltiples / Otros</span>
                                        )}
                                    </td>
                                    <td>{v.usuarioNombre}</td>
                                    <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>{v.descripcion}</td>
                                    <td className="text-right" style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                                        ${v.monto.toLocaleString()}
                                    </td>
                                    <td className="text-center">
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
                                    </td>
                                </tr>
                            ))}
                            {filteredVentas.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No hay registros de ventas manuales para mostrar.
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
