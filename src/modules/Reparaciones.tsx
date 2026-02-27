import React, { useState } from 'react';
import type { Reparacion, Cliente, Proveedor } from '../App';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface IProps {
    reparaciones: Reparacion[];
    clientes: Cliente[];
    proveedores: Proveedor[];
    onAdd: (r: Reparacion) => void;
    onUpdate: (r: Reparacion) => void;
    onDelete: (id: string) => void;
}

const ReparacionesModule: React.FC<IProps> = ({ reparaciones, clientes, proveedores, onAdd, onUpdate, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Reparacion>>({
        estado: 'Recibido',
        tipoServicio: 'HELP SOLUCIONES',
        fechaIngreso: new Date().toLocaleDateString()
    });

    const getNextConsecutivo = () => {
        if (reparaciones.length === 0) return 'REP-001';
        const last = reparaciones[0].consecutivo; // Since we prepend new ones
        const num = parseInt(last.replace('REP-', '')) + 1;
        return `REP-${num.toString().padStart(3, '0')}`;
    };

    const handleSave = () => {
        const actualConsecutivo = editingId ? formData.consecutivo : getNextConsecutivo();
        if (formData.clienteId && formData.serial) {
            const client = clientes.find(c => c.id === formData.clienteId);
            const provider = proveedores.find(p => p.id === formData.proveedorId);
            const repairData = {
                ...formData,
                consecutivo: actualConsecutivo,
                clienteNombre: client?.nombre || 'Desconocido',
                proveedorNombre: formData.tipoServicio === 'Proveedor' ? (provider?.nombre || 'Proveedor Desconocido') : undefined,
                fechaIngreso: formData.fechaIngreso || new Date().toLocaleDateString(),
            } as Reparacion;

            if (editingId) {
                onUpdate({ ...repairData, id: editingId });
                setEditingId(null);
            } else {
                onAdd({ ...repairData, id: Date.now().toString() });
                setIsAdding(false);
            }
            setFormData({ estado: 'Recibido', tipoServicio: 'HELP SOLUCIONES', fechaIngreso: new Date().toLocaleDateString() });
        } else {
            alert('Por favor complete Cliente y Serial');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, foto: file.name });
        }
    };

    const startEdit = (r: Reparacion) => {
        setFormData(r);
        setEditingId(r.id);
        setIsAdding(false);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ estado: 'Recibido', tipoServicio: 'HELP SOLUCIONES', fechaIngreso: new Date().toLocaleDateString() });
    };

    const generateTicket = async (r: Reparacion) => {
        const doc = new jsPDF({
            unit: 'mm',
            format: [80, 150] // Common thermal printer format
        });

        // Branding
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('HELP SOLUCIONES', 40, 10, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Soporte Técnico Especializado', 40, 14, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(5, 16, 75, 16);

        // Ticket Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`ORDEN: ${r.consecutivo}`, 5, 22);
        doc.setFontSize(8);
        doc.text(`Fecha: ${r.fechaIngreso}`, 5, 26);

        doc.setFont('helvetica', 'bold');
        doc.text('CLIENTE:', 5, 32);
        doc.setFont('helvetica', 'normal');
        doc.text(r.clienteNombre, 5, 36);

        doc.setFont('helvetica', 'bold');
        doc.text('EQUIPO:', 5, 42);
        doc.setFont('helvetica', 'normal');
        doc.text(`${r.tipo} ${r.marca}`, 5, 46);
        doc.text(`S/N: ${r.serial}`, 5, 50);

        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVACIONES:', 5, 56);
        doc.setFont('helvetica', 'normal');
        const obs = doc.splitTextToSize(r.observaciones || 'Sin observaciones', 70);
        doc.text(obs, 5, 60);

        // QR Code
        const qrContent = `ID:${r.id}|CON:${r.consecutivo}|SN:${r.serial}`;
        try {
            const qrDataUrl = await QRCode.toDataURL(qrContent, { margin: 1, width: 100 });
            doc.addImage(qrDataUrl, 'PNG', 25, 80, 30, 30);
        } catch (err) {
            console.error('Error generating QR', err);
        }

        doc.setFontSize(7);
        doc.text('Escanee para seguimiento', 40, 112, { align: 'center' });

        doc.setFontSize(8);
        doc.text('Gracias por su confianza', 40, 120, { align: 'center' });

        doc.save(`Ticket_${r.consecutivo}.pdf`);
    };

    return (
        <div className="module-container">
            <div className="module-header">
                <h2>Gestión de Reparaciones</h2>
                <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ estado: 'Recibido', tipoServicio: 'HELP SOLUCIONES', fechaIngreso: new Date().toLocaleDateString() }); }}>+ Nueva Reparación</button>
            </div>

            {(isAdding || editingId) && (
                <div className="card animate-fade-in" style={{ marginBottom: '2rem', border: editingId ? '2px solid var(--primary-blue)' : 'none' }}>
                    <h3>{editingId ? 'Editar Reparación' : 'Registrar Ingreso de Equipo'}</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Consecutivo</label>
                            <input
                                className="input-field"
                                placeholder="Automático (REP-XXX)"
                                value={editingId ? (formData.consecutivo || '') : 'Automático'}
                                disabled
                                style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', color: 'var(--primary-blue)' }}
                            />
                        </div>
                        <div className="form-group">
                            <label>Cliente</label>
                            <select className="input-field" value={formData.clienteId || ''} onChange={e => setFormData({ ...formData, clienteId: e.target.value })}>
                                <option value="">Seleccione un cliente...</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tipo de Equipo</label>
                            <input className="input-field" placeholder="Ej: Portátil, Impresora" value={formData.tipo || ''} onChange={e => setFormData({ ...formData, tipo: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Marca</label>
                            <input className="input-field" placeholder="Ej: HP, Dell, Lenovo" value={formData.marca || ''} onChange={e => setFormData({ ...formData, marca: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Serial</label>
                            <input className="input-field" placeholder="Número de serie" value={formData.serial || ''} onChange={e => setFormData({ ...formData, serial: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Tipo de Servicio</label>
                            <select className="input-field" value={formData.tipoServicio || 'HELP SOLUCIONES'} onChange={e => setFormData({ ...formData, tipoServicio: e.target.value as any, proveedorId: undefined })}>
                                <option value="HELP SOLUCIONES">HELP SOLUCIONES (Interno)</option>
                                <option value="Proveedor">Proveedor (Externo)</option>
                            </select>
                        </div>
                        {formData.tipoServicio === 'Proveedor' && (
                            <div className="form-group animate-fade-in">
                                <label>Seleccionar Proveedor</label>
                                <select className="input-field" value={formData.proveedorId || ''} onChange={e => setFormData({ ...formData, proveedorId: e.target.value })}>
                                    <option value="">Seleccione un proveedor...</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="form-group">
                            <label>Estado</label>
                            <select className="input-field" value={formData.estado || 'Recibido'} onChange={e => setFormData({ ...formData, estado: e.target.value as any })}>
                                <option value="Recibido">Recibido</option>
                                <option value="En Diagnóstico">En Diagnóstico</option>
                                <option value="En Reparación">En Reparación</option>
                                <option value="Esperando Repuestos">Esperando Repuestos</option>
                                <option value="Reparado">Reparado</option>
                                <option value="Entregado">Entregado</option>
                                <option value="Cerrado">Cerrado</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Observaciones / Falla Reportada</label>
                            <textarea className="input-field" style={{ minHeight: '80px' }} value={formData.observaciones || ''} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Foto del Equipo</label>
                            <div className="file-input-wrapper">
                                <input type="file" onChange={handleFileChange} />
                                {formData.foto && <small style={{ color: 'var(--primary-blue)' }}>✅ {formData.foto}</small>}
                            </div>
                        </div>
                    </div>
                    <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button onClick={handleSave} className="btn-success">{editingId ? 'Actualizar' : 'Guardar Ingreso'}</button>
                        <button className="btn-secondary" onClick={cancel}>Cancelar</button>
                    </div>
                </div>
            )}

            <div className="card table-card animate-fade-in">
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Consecutivo</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Equipo</th>
                                <th>Serial</th>
                                <th>Servicio</th>
                                <th>Estado</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reparaciones.length > 0 ? reparaciones.map(r => (
                                <tr key={r.id}>
                                    <td><strong>{r.consecutivo}</strong></td>
                                    <td><small>{r.fechaIngreso}</small></td>
                                    <td>{r.clienteNombre}</td>
                                    <td>
                                        <div style={{ fontSize: '0.9rem' }}>
                                            <strong>{r.tipo}</strong> {r.marca}
                                        </div>
                                    </td>
                                    <td><code className="part-number-badge">{r.serial}</code></td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <span className={`status-tag service-${r.tipoServicio === 'Proveedor' ? 'external' : 'internal'}`}>
                                                {r.tipoServicio}
                                            </span>
                                            {r.tipoServicio === 'Proveedor' && r.proveedorNombre && (
                                                <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {r.proveedorNombre}
                                                </small>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-tag repair-${r.estado.toLowerCase().replace(/ /g, '-')}`}>
                                            {r.estado}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                            <button className="btn-ticket" onClick={() => generateTicket(r)} title="Imprimir Ticket">🖨️</button>
                                            <button className="btn-edit" onClick={() => startEdit(r)} title="Editar/Actualizar">✏️</button>
                                            <button className="btn-delete-icon" onClick={() => { if (window.confirm('¿Eliminar registro de reparación?')) onDelete(r.id) }} title="Eliminar">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No hay reparaciones en curso.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .status-tag.repair-recibido { background: #f1f5f9; color: #475569; }
                .status-tag.repair-en-diagnóstico { background: #fef3c7; color: #92400e; }
                .status-tag.repair-en-reparación { background: #dbeafe; color: #1e40af; }
                .status-tag.repair-esperando-repuestos { background: #fee2e2; color: #991b1b; }
                .status-tag.repair-reparado { background: #dcfce7; color: #166534; }
                .status-tag.repair-entregado { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
                .status-tag.repair-cerrado { background: #e2e8f0; color: #64748b; opacity: 0.7; }

                .status-tag.service-internal { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
                .status-tag.service-external { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
                
                .file-input-wrapper { display: flex; flex-direction: column; gap: 0.2rem; }
                .file-input-wrapper input { font-size: 0.8rem; }

                .btn-ticket { 
                    background: #f0fdf4; 
                    color: #15803d; 
                    border: 1px solid #bbf7d0; 
                    padding: 0.3rem 0.6rem; 
                    border-radius: 6px; 
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.2s;
                }
                .btn-ticket:hover { background: #dcfce7; transform: translateY(-1px); }
            `}</style>
        </div>
    );
};

export default ReparacionesModule;
