import React, { useState } from 'react';
import type { Alquiler, Cliente, AppUser } from '../App';

interface IProps {
    alquileres: Alquiler[];
    clientes: Cliente[];
    onAddAlquiler: (a: Alquiler) => Promise<boolean>;
    onUpdateAlquiler: (a: Alquiler) => Promise<boolean>;
    onDeleteAlquiler: (id: string) => Promise<void>;
    currentUser: AppUser | null;
}

const AlquileresModule: React.FC<IProps> = ({ alquileres, clientes, onAddAlquiler, onUpdateAlquiler, onDeleteAlquiler, currentUser }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [descripcion, setDescripcion] = useState('');
    const [serial, setSerial] = useState('');
    const [fotoUrl, setFotoUrl] = useState('');
    const [estado, setEstado] = useState<'Bodega' | 'Alquilado'>('Bodega');
    const [clienteId, setClienteId] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [valorMensual, setValorMensual] = useState(0);

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setDescripcion('');
        setSerial('');
        setFotoUrl('');
        setEstado('Bodega');
        setClienteId('');
        setFechaInicio('');
        setValorMensual(0);
    };

    const handleSubmit = async () => {
        if (!descripcion || !serial) {
            alert('Descripción y Serial son requeridos');
            return;
        }

        const data: Alquiler = {
            id: editingId || crypto.randomUUID(),
            descripcion,
            serial,
            fotoUrl,
            estado,
            clienteId: estado === 'Alquilado' ? clienteId : undefined,
            clienteNombre: estado === 'Alquilado' ? clientes.find(c => c.id === clienteId)?.nombre : undefined,
            fechaInicio: estado === 'Alquilado' ? fechaInicio : undefined,
            valorMensual,
            usuarioId: currentUser?.id || ''
        };

        const success = editingId ? await onUpdateAlquiler(data) : await onAddAlquiler(data);
        if (success) resetForm();
    };

    const handleEdit = (a: Alquiler) => {
        setEditingId(a.id);
        setDescripcion(a.descripcion);
        setSerial(a.serial);
        setFotoUrl(a.fotoUrl || '');
        setEstado(a.estado);
        setClienteId(a.clienteId || '');
        setFechaInicio(a.fechaInicio || '');
        setValorMensual(a.valorMensual);
        setIsAdding(true);
    };

    const filtered = alquileres.filter(a =>
        a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.serial.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="module-container">
            <div className="module-header">
                <h2>Gestión de Alquileres</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar por descripción o serial..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '300px' }}
                    />
                    <button onClick={() => setIsAdding(true)} className="btn-primary">+ Nuevo Equipo</button>
                </div>
            </div>

            {isAdding && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
                    <h3>{editingId ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}</h3>
                    <div className="form-grid">
                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label>Descripción del Equipo</label>
                                <input className="input-field" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                            </div>
                            <div className="form-group flex-1">
                                <label>Número de Serial</label>
                                <input className="input-field" value={serial} onChange={e => setSerial(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label>Estado (Semáforo)</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    <button
                                        className={`btn-action ${estado === 'Bodega' ? 'active-red' : ''}`}
                                        onClick={() => setEstado('Bodega')}
                                        style={{
                                            background: estado === 'Bodega' ? '#fee2e2' : '#f3f4f6',
                                            color: estado === 'Bodega' ? '#ef4444' : '#6b7280',
                                            border: '2px solid',
                                            borderColor: estado === 'Bodega' ? '#ef4444' : 'transparent',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🔴 Bodega
                                    </button>
                                    <button
                                        className={`btn-action ${estado === 'Alquilado' ? 'active-green' : ''}`}
                                        onClick={() => setEstado('Alquilado')}
                                        style={{
                                            background: estado === 'Alquilado' ? '#dcfce7' : '#f3f4f6',
                                            color: estado === 'Alquilado' ? '#166534' : '#6b7280',
                                            border: '2px solid',
                                            borderColor: estado === 'Alquilado' ? '#166534' : 'transparent',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🟢 Alquilado
                                    </button>
                                </div>
                            </div>
                            <div className="form-group flex-1">
                                <label>Valor Mensual</label>
                                <input type="number" className="input-field" value={valorMensual} onChange={e => setValorMensual(Number(e.target.value))} />
                            </div>
                        </div>

                        {estado === 'Alquilado' && (
                            <div className="form-row animate-fade-in" style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                                <div className="form-group flex-1">
                                    <label>Cliente</label>
                                    <select className="input-field" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                                        <option value="">Seleccione un cliente</option>
                                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Fecha de Inicio del Alquiler</label>
                                    <input type="date" className="input-field" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={resetForm}>Cancelar</button>
                        <button className="btn-success" onClick={handleSubmit}>Guardar Equipo</button>
                    </div>
                </div>
            )}

            <div className="card table-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>Foto</th>
                            <th>Descripción / Serial</th>
                            <th className="text-center">Estado</th>
                            <th>Cliente / Fecha</th>
                            <th className="text-right">V. Mensual</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(a => (
                            <tr key={a.id}>
                                <td>
                                    <div style={{ width: '50px', height: '50px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {a.fotoUrl ? <img src={a.fotoUrl} alt="Foto" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : '🖼️'}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: '600' }}>{a.descripcion}</div>
                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>SN: {a.serial}</div>
                                </td>
                                <td className="text-center">
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                                        background: a.estado === 'Alquilado' ? '#dcfce7' : '#fee2e2',
                                        color: a.estado === 'Alquilado' ? '#166534' : '#ef4444'
                                    }}>
                                        {a.estado}
                                    </span>
                                </td>
                                <td>
                                    {a.estado === 'Alquilado' ? (
                                        <>
                                            <div style={{ fontWeight: '500' }}>{a.clienteNombre}</div>
                                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Desde: {a.fechaInicio}</div>
                                        </>
                                    ) : '-'}
                                </td>
                                <td className="text-right" style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
                                    ${a.valorMensual.toLocaleString()}
                                </td>
                                <td className="text-center">
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button className="btn-action" onClick={() => handleEdit(a)}>✏️</button>
                                        <button className="btn-action" style={{ color: 'var(--error)' }} onClick={() => {
                                            if (confirm('¿Eliminar equipo?')) onDeleteAlquiler(a.id);
                                        }}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AlquileresModule;
