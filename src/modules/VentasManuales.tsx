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
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [selectedUsuarioId, setSelectedUsuarioId] = useState(currentUser.id);
    const [monto, setMonto] = useState(0);
    const [descripcion, setDescripcion] = useState('');

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
                <button className="btn-primary" onClick={() => setIsAdding(true)}>+ Registrar Venta</button>
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
                                    {productos.filter(p => p.estado === 'Activo').map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.referencia} - {p.nombre} (Stock: {p.items?.filter(i => i.estado === 'Disponible').length || 0})
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
