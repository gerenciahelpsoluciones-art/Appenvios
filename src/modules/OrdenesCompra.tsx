import React, { useState } from 'react';
import type { Proveedor, Producto, OrdenCompra, OrdenCompraItem, AppUser } from '../App';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface IProps {
    proveedores: Proveedor[];
    productos: Producto[];
    ordenesCompra: OrdenCompra[];
    onAddOC: (oc: OrdenCompra) => void;
    onUpdateOC: (oc: OrdenCompra) => void;
    onDeleteOC: (id: string) => void;
    currentUser: AppUser;
}

const OrdenesCompraModule: React.FC<IProps> = ({ proveedores, productos, ordenesCompra, onAddOC, onUpdateOC, onDeleteOC, currentUser }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState<string>('');
    const [condiciones, setCondiciones] = useState('Contado');
    const [observaciones, setObservaciones] = useState('');
    const [items, setItems] = useState<OrdenCompraItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form for new item
    const [selectedProdId, setSelectedProdId] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState(0);

    const handleAddItem = () => {
        const prod = productos.find(p => p.id === selectedProdId);
        if (prod && cantidad > 0) {
            const newItem: OrdenCompraItem = {
                id: Date.now().toString(),
                productoId: prod.id,
                nombreProducto: prod.nombre,
                numPart: prod.numPart,
                cantidad: cantidad,
                precioUnitario: precioUnitario || prod.precioCompra || 0
            };
            setItems([...items, newItem]);
            setSelectedProdId('');
            setCantidad(1);
            setPrecioUnitario(0);
        }
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const subtotal = items.reduce((acc, item) => acc + (item.cantidad * item.precioUnitario), 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    const handleGenerateOC = () => {
        const prov = proveedores.find(p => p.id === selectedProveedor);
        if (!prov || items.length === 0) {
            alert('Seleccione un proveedor y añada al menos un producto');
            return;
        }

        const nextConsecutivoValue = ordenesCompra.length + 1;
        const nextConsecutivo = editingId
            ? ordenesCompra.find(oc => oc.id === editingId)?.consecutivo || ''
            : `OC-${nextConsecutivoValue.toString().padStart(4, '0')}`;

        const ocData: OrdenCompra = {
            id: editingId || Date.now().toString(),
            consecutivo: nextConsecutivo,
            fecha: editingId
                ? ordenesCompra.find(oc => oc.id === editingId)?.fecha || new Date().toLocaleDateString()
                : new Date().toLocaleDateString(),
            proveedorId: prov.id,
            nombreProveedor: prov.nombre,
            items: items,
            subtotal: subtotal,
            iva: iva,
            total: total,
            condicionesComerciales: condiciones,
            observaciones: observaciones,
            usuarioId: currentUser.id,
            estado: editingId ? (ordenesCompra.find(oc => oc.id === editingId)?.estado || 'Pendiente') : 'Pendiente'
        };

        if (editingId) {
            onUpdateOC(ocData);
        } else {
            onAddOC(ocData);
        }

        generatePDF(ocData, prov);
        resetForm();
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setSelectedProveedor('');
        setItems([]);
        setCondiciones('Contado');
        setObservaciones('');
    };

    const handleEdit = (oc: OrdenCompra) => {
        setEditingId(oc.id);
        setSelectedProveedor(oc.proveedorId);
        setCondiciones(oc.condicionesComerciales);
        setObservaciones(oc.observaciones);
        setItems(oc.items);
        setIsAdding(true);
    };

    const generatePDF = (oc: OrdenCompra, prov: Proveedor) => {
        const doc = new jsPDF();

        // Header / Branding
        doc.setFillColor(0, 74, 153);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ORDEN DE COMPRA', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Consecutivo: ${oc.consecutivo}`, 105, 30, { align: 'center' });

        // Company Details (Left)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('HELP SOLUCIONES INFORMATICAS', 15, 50);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('NIT: 900686378-7', 15, 56);
        doc.text('www.helpsoluciones.com.co', 15, 62);

        // Supplier Details (Right)
        doc.setFont('helvetica', 'bold');
        doc.text('PROVEEDOR:', 120, 50);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(prov.nombre, 120, 56);
        doc.text(`NIT: ${prov.nit}`, 120, 62);
        doc.text(`Contacto: ${prov.contacto}`, 120, 68);
        doc.text(`Tel: ${prov.telefono}`, 120, 74);

        doc.setFontSize(10);
        doc.text(`Fecha: ${oc.fecha}`, 15, 80);

        // Items Table
        const tableData = oc.items.map(item => [
            item.numPart,
            item.nombreProducto,
            item.cantidad,
            `$${item.precioUnitario.toLocaleString()}`,
            `$${(item.cantidad * item.precioUnitario).toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 90,
            head: [['N° Parte', 'Producto', 'Cant', 'Vr. Unitario', 'Subtotal']],
            body: tableData,
            headStyles: { fillColor: [0, 74, 153] },
            theme: 'striped'
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // Totals Box (Styled)
        doc.setFillColor(245, 247, 250);
        doc.rect(130, finalY - 5, 70, 28, 'F');
        doc.setDrawColor(200, 203, 207);
        doc.rect(130, finalY - 5, 70, 28, 'S');

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.text('Subtotal:', 135, finalY + 2);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${oc.subtotal.toLocaleString()}`, 195, finalY + 2, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.text('IVA (19%):', 135, finalY + 9);
        doc.setFont('helvetica', 'normal');
        doc.text(`$${oc.iva.toLocaleString()}`, 195, finalY + 9, { align: 'right' });

        doc.setFontSize(11);
        doc.setTextColor(0, 74, 153);
        doc.setFont('helvetica', 'bold');
        doc.text('VALOR TOTAL:', 135, finalY + 18);
        doc.text(`$${oc.total.toLocaleString()}`, 195, finalY + 18, { align: 'right' });

        // Footer / Conditions
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Condiciones Comerciales:', 15, finalY + 30);
        doc.setFont('helvetica', 'normal');
        doc.text(oc.condicionesComerciales, 15, finalY + 36);

        if (oc.observaciones) {
            doc.setFont('helvetica', 'bold');
            doc.text('Observaciones:', 15, finalY + 46);
            doc.setFont('helvetica', 'normal');
            doc.text(oc.observaciones, 15, finalY + 52, { maxWidth: 180 });
        }

        doc.save(`OC_${oc.consecutivo}_${prov.nombre.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="module-container">
            <div className="module-header">
                <h2>Ordenes de Compra</h2>
                <button onClick={() => setIsAdding(true)}>+ Nueva Orden</button>
            </div>

            {isAdding && (
                <div className="card form-card">
                    <h3>{editingId ? 'Editar Orden de Compra' : 'Generar Nueva Orden de Compra'}</h3>
                    <div className="form-grid-modern">
                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label>Proveedor</label>
                                <select
                                    className="input-field"
                                    value={selectedProveedor}
                                    onChange={e => setSelectedProveedor(e.target.value)}
                                >
                                    <option value="">Seleccione un proveedor</option>
                                    {proveedores.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre} - {p.nit}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label>Condiciones de Pago</label>
                                <select
                                    className="input-field"
                                    value={condiciones}
                                    onChange={e => setCondiciones(e.target.value)}
                                >
                                    <option value="Contado">Contado</option>
                                    <option value="30 días">30 días</option>
                                    <option value="45 días">45 días</option>
                                    <option value="60 días">60 días</option>
                                </select>
                            </div>
                        </div>

                        <div className="item-selection card" style={{ background: 'var(--background-light)', marginTop: '1rem' }}>
                            <h4>Añadir Productos</h4>
                            <div className="form-row" style={{ alignItems: 'flex-end' }}>
                                <div className="form-group flex-2">
                                    <label>Producto</label>
                                    <select
                                        className="input-field"
                                        value={selectedProdId}
                                        onChange={e => {
                                            const p = productos.find(x => x.id === e.target.value);
                                            setSelectedProdId(e.target.value);
                                            if (p) setPrecioUnitario(p.precioCompra || 0);
                                        }}
                                    >
                                        <option value="">Seleccione producto</option>
                                        {productos.map(p => (
                                            <option key={p.id} value={p.id}>[{p.numPart}] {p.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Cantidad</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={cantidad}
                                        onChange={e => setCantidad(Number(e.target.value))}
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Precio Unitario</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={precioUnitario}
                                        onChange={e => setPrecioUnitario(Number(e.target.value))}
                                    />
                                </div>
                                <button className="btn-success" onClick={handleAddItem} style={{ height: '42px' }}>Añadir</button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ marginTop: '1rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: '150px' }}>N° Parte</th>
                                        <th style={{ minWidth: '200px' }}>Producto</th>
                                        <th className="text-right" style={{ minWidth: '80px' }}>Cant</th>
                                        <th className="text-right" style={{ minWidth: '120px' }}>Unitario</th>
                                        <th className="text-right" style={{ minWidth: '120px' }}>Subtotal</th>
                                        <th className="text-center" style={{ width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.numPart}</td>
                                            <td>{item.nombreProducto}</td>
                                            <td className="text-right">{item.cantidad}</td>
                                            <td className="text-right">${item.precioUnitario.toLocaleString()}</td>
                                            <td className="text-right">${(item.cantidad * item.precioUnitario).toLocaleString()}</td>
                                            <td className="text-center">
                                                <button className="btn-delete" onClick={() => removeItem(item.id)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="form-row" style={{ marginTop: '1rem' }}>
                            <div className="form-group flex-1">
                                <label>Observaciones</label>
                                <textarea
                                    className="input-field"
                                    style={{ height: '80px', resize: 'vertical' }}
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                    placeholder="Detalles adicionales de la orden..."
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                            <div className="text-muted" style={{ marginBottom: '0.25rem' }}>Subtotal: ${subtotal.toLocaleString()}</div>
                            <div className="text-muted" style={{ marginBottom: '0.25rem' }}>IVA (19%): ${iva.toLocaleString()}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                                TOTAL: ${total.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="form-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={resetForm}>Cancelar</button>
                        <button className="btn-primary" onClick={handleGenerateOC} style={{ padding: '0.75rem 2rem' }}>
                            {editingId ? 'Guardar Cambios' : 'Generar OC y PDF'}
                        </button>
                    </div>
                </div>
            )}

            <div className="card table-card" style={{ marginTop: '2rem' }}>
                <h3>Historial de Ordenes de Compra</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '140px' }}>Consecutivo</th>
                                <th style={{ minWidth: '110px' }}>Fecha</th>
                                <th style={{ minWidth: '300px' }}>Proveedor</th>
                                <th className="text-right" style={{ minWidth: '120px' }}>Total</th>
                                <th className="text-center" style={{ minWidth: '150px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenesCompra.map(oc => (
                                <tr key={oc.id}>
                                    <td><strong>{oc.consecutivo}</strong></td>
                                    <td>{oc.fecha}</td>
                                    <td>{oc.nombreProveedor}</td>
                                    <td className="text-right" style={{ color: 'var(--primary-blue)', fontWeight: 'bold', fontFamily: 'Courier New, monospace' }}>
                                        ${oc.total.toLocaleString()}
                                    </td>
                                    <td className="text-center">
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                className="btn-action"
                                                onClick={() => handleEdit(oc)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-action"
                                                onClick={() => {
                                                    const prov = proveedores.find(p => p.id === oc.proveedorId);
                                                    if (prov) generatePDF(oc, prov);
                                                }}
                                                title="Re-descargar PDF"
                                            >
                                                📄
                                            </button>
                                            <button
                                                className="btn-action"
                                                style={{ color: 'var(--error)' }}
                                                onClick={() => {
                                                    if (window.confirm('¿Eliminar esta orden de compra?')) onDeleteOC(oc.id);
                                                }}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {ordenesCompra.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                        No hay ordenes de compra registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .item-selection {
                    padding: 1rem;
                    border: 1px dashed var(--border-color);
                }
                .btn-delete {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.1rem;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                }
                .btn-delete:hover {
                    background: #fee2e2;
                }
                .btn-primary {
                    background: var(--primary-blue);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-primary:hover {
                    opacity: 0.9;
                }
            `}</style>
        </div>
    );
};

export default OrdenesCompraModule;
