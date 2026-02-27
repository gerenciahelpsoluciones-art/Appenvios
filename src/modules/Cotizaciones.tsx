import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Cliente, Producto, Proveedor, Cotizacion, AppUser } from '../App';

interface QuoteItem {
    id: string;
    productoId: string;
    proveedorId: string;
    unidad: string;
    cantidad: number;
    costoUnitario: number;
    utilidad: number; // %
    iva: number; // %
}

interface IProps {
    clientes: Cliente[];
    productos: Producto[];
    proveedores: Proveedor[];
    onAddQuote: (c: Cotizacion) => void;
    onSendWhatsApp: (phone: string, message: string) => void;
    currentUser: AppUser;
}

const CotizacionesModule: React.FC<IProps> = ({
    clientes,
    productos,
    proveedores,
    onAddQuote,
    onSendWhatsApp,
    currentUser
}) => {
    const [items, setItems] = useState<QuoteItem[]>([]);
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [consecutivo, setConsecutivo] = useState(`HS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`);
    const [condiciones, setCondiciones] = useState('1. Forma de pago: Contado.\n2. Tiempo de entrega: 3 a 5 días hábiles.\n3. Garantía: 12 meses por defectos de fábrica.');
    const [ejecutivo, setEjecutivo] = useState({
        nombre: 'CARLOS ALBERTO CORREA',
        cargo: 'Ejecutiva Comercial',
        telefono: '316 000 0000',
        correo: 'ventas@helpsoluciones.com.co'
    });

    const selectedCliente = clientes.find(c => c.id === selectedClienteId);

    const addItem = () => {
        const newItem: QuoteItem = {
            id: Date.now().toString(),
            productoId: '',
            proveedorId: '',
            unidad: 'Und',
            cantidad: 1,
            costoUnitario: 0,
            utilidad: 15,
            iva: 19
        };
        setItems([...items, newItem]);
    };

    const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
        const newItems = items.map(item => {
            if (item.id === id) {
                if (field === 'productoId') {
                    const prod = productos.find(p => p.id === value);
                    return { ...item, productoId: value, costoUnitario: prod?.precioCompra || 0, unidad: prod?.unidad || 'Und' };
                }
                return { ...item, [field]: value };
            }
            return item;
        });
        setItems(newItems);
    };

    const calculateVenta = (item: QuoteItem) => {
        return item.costoUnitario * (1 + item.utilidad / 100);
    };

    const calculateSubtotalItem = (item: QuoteItem) => {
        return calculateVenta(item) * item.cantidad;
    };

    const calculateIVAItem = (item: QuoteItem) => {
        return calculateSubtotalItem(item) * (item.iva / 100);
    };

    const calculateTotalItem = (item: QuoteItem) => {
        return calculateSubtotalItem(item) + calculateIVAItem(item);
    };

    const subtotalGeneral = items.reduce((acc, item) => acc + calculateSubtotalItem(item), 0);
    const ivaGeneral = items.reduce((acc, item) => acc + calculateIVAItem(item), 0);
    const grandTotal = subtotalGeneral + ivaGeneral;

    const generatePDF = () => {
        try {
            const doc = new jsPDF();

            // Branding Header
            doc.setFillColor(0, 74, 153);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setFontSize(20);
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text("HELP SOLUCIONES INFORMATICAS", 14, 22);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Cotización N°: ${consecutivo}`, 200, 22, { align: 'right' });
            doc.text("Expertos en Tecnología | Servicios y Productos", 14, 30);

            // Client Info Box
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("INFORMACIÓN DEL CLIENTE", 14, 50);
            doc.line(14, 52, 100, 52);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            if (selectedCliente) {
                doc.text(`Nombre: ${selectedCliente.nombre}`, 14, 60);
                doc.text(`NIT: ${selectedCliente.nit}`, 14, 65);
                doc.text(`Contacto: ${selectedCliente.contacto}`, 14, 70);
                doc.text(`Dirección: ${selectedCliente.direccion}`, 14, 75);
            }

            doc.text(`Fecha: ${new Date().toISOString().split('T')[0]}`, 150, 60);
            doc.text(`Validez: 15 días calendario`, 150, 65);

            // Table Data
            const tableData = items.map(item => {
                const prod = productos.find(p => p.id === item.productoId);
                return [
                    prod?.nombre || 'N/A',
                    prod?.numPart || 'N/A',
                    item.unidad,
                    item.cantidad,
                    `$${calculateVenta(item).toLocaleString()}`,
                    `$${calculateTotalItem(item).toLocaleString()}`
                ];
            });

            // Using autoTable function directly
            autoTable(doc, {
                startY: 85,
                head: [['Descripción del Producto', 'N° Parte', 'Unidad', 'Cant.', 'Precio Unit.', 'Subtotal']],
                body: tableData,
                headStyles: { fillColor: [0, 74, 153], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [240, 245, 255] },
                margin: { top: 85 }
            });

            // Safe way to get final Y position
            let finalY = 85;
            const docAny = doc as any;
            if (docAny.lastAutoTable && docAny.lastAutoTable.cursor) {
                finalY = docAny.lastAutoTable.cursor.y;
            } else {
                // Fallback if autoTable didn't set cursor (e.g. empty table or version issue)
                finalY = 85 + (tableData.length * 10) + 15;
            }

            // Totals
            const totalsX = 135; // Position for labels
            const valuesX = 195; // Position for values (right-aligned)

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(`SUBTOTAL:`, totalsX, finalY + 15);
            doc.setFont("helvetica", "normal");
            doc.text(`$${subtotalGeneral.toLocaleString()}`, valuesX, finalY + 15, { align: 'right' });

            doc.setFont("helvetica", "bold");
            doc.text(`IVA TOTAL:`, totalsX, finalY + 22);
            doc.setFont("helvetica", "normal");
            doc.text(`$${ivaGeneral.toLocaleString()}`, valuesX, finalY + 22, { align: 'right' });

            doc.setFillColor(0, 74, 153);
            doc.rect(totalsX - 5, finalY + 28, 70, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`VALOR TOTAL:`, totalsX, finalY + 36);
            doc.text(`$${grandTotal.toLocaleString()}`, valuesX, finalY + 36, { align: 'right' });

            // Conditions Section
            if (condiciones) {
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text("CONDICIONES COMERCIALES:", 14, finalY + 50);
                doc.setFont("helvetica", "normal");
                const splitCondiciones = doc.splitTextToSize(condiciones, 180);
                doc.text(splitCondiciones, 14, finalY + 58);
            }

            // Executive Section
            const execY = finalY + 90;
            doc.setFont("helvetica", "bold");
            doc.text("ATENTAMENTE,", 14, execY);
            doc.text(ejecutivo.nombre, 14, execY + 10);
            doc.setFont("helvetica", "normal");
            doc.text(ejecutivo.cargo, 14, execY + 15);
            doc.text(`Tel: ${ejecutivo.telefono}`, 14, execY + 20);
            doc.text(`Email: ${ejecutivo.correo}`, 14, execY + 25);

            // Footer branding
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("HELP SOLUCIONES INFORMATICAS - NIT 900686378-7", 105, 285, { align: 'center' });

            // Trigger global save if callback exists
            if (onAddQuote) {
                onAddQuote({
                    id: Math.random().toString(36).substr(2, 9),
                    fecha: new Date().toISOString().split('T')[0],
                    clienteId: selectedClienteId,
                    clienteNombre: selectedCliente?.nombre || 'N/A',
                    consecutivo: consecutivo,
                    items: items.map(item => ({
                        id: item.id,
                        productoId: item.productoId,
                        proveedorId: item.proveedorId,
                        unidad: item.unidad,
                        cantidad: item.cantidad,
                        costoUnitario: item.costoUnitario,
                        utilidad: item.utilidad,
                        iva: item.iva
                    })),
                    subtotal: subtotalGeneral,
                    iva: ivaGeneral,
                    total: grandTotal,
                    ejecutivo: ejecutivo.nombre,
                    ejecutivoEmail: ejecutivo.correo,
                    ejecutivoTelefono: ejecutivo.telefono,
                    usuarioId: currentUser.id,
                    estado: 'Seguimiento'
                });
            }

            // Save PDF
            doc.save(`COTIZACION HELP SOLUCIONES INFORMATICAS NIT-900686378-7_${consecutivo}.pdf`);
        } catch (error: any) {
            console.error("Error generating PDF:", error);
            alert(`Error al generar el PDF: ${error.message || 'Error desconocido'}. Verifique los datos ingresados.`);
        }
    };

    return (
        <div className="module-container">
            <div className="module-header">
                <h2>Generar Cotización</h2>
                <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
                    {selectedCliente && (
                        <button className="btn-secondary" onClick={() => onSendWhatsApp(selectedCliente.telefono, `Hola ${selectedCliente.nombre}, adjunto envío la cotización ${consecutivo} por valor de $${grandTotal.toLocaleString()}.`)}>
                            📱 Enviar WhatsApp
                        </button>
                    )}
                    <button className="btn-success" onClick={generatePDF} disabled={!selectedClienteId || items.length === 0}>
                        💾 Guardar y Generar PDF
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h3>Información del Cliente</h3>
                        <div className="form-grid">
                            <select
                                className="input-field"
                                value={selectedClienteId}
                                onChange={e => setSelectedClienteId(e.target.value)}
                            >
                                <option value="">-- Seleccionar Cliente --</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre} (NIT: {c.nit})</option>
                                ))}
                            </select>
                            <input className="input-field" type="date" value={new Date().toISOString().split('T')[0]} readOnly title="Fecha" />
                        </div>
                    </div>
                    <div>
                        <h3>Referencia de Cotización</h3>
                        <div className="form-grid">
                            <input
                                className="input-field"
                                placeholder="N° Consecutivo"
                                value={consecutivo}
                                onChange={e => setConsecutivo(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                {selectedCliente && (
                    <div className="client-detail-box">
                        <p><strong>Contacto:</strong> {selectedCliente.contacto} | <strong>Tel:</strong> {selectedCliente.telefono} | <strong>Dir:</strong> {selectedCliente.direccion}</p>
                    </div>
                )}
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h3>Condiciones Comerciales</h3>
                        <textarea
                            className="input-field"
                            rows={4}
                            style={{ width: '100%', resize: 'vertical', marginTop: '0.5rem' }}
                            placeholder="Escriba aquí las condiciones comerciales..."
                            value={condiciones}
                            onChange={e => setCondiciones(e.target.value)}
                        />
                    </div>
                    <div>
                        <h3>Datos de Ejecutivo Comercial</h3>
                        <div className="form-grid">
                            <input className="input-field" placeholder="Nombre Ejecutivo" value={ejecutivo.nombre} onChange={e => setEjecutivo({ ...ejecutivo, nombre: e.target.value })} />
                            <input className="input-field" placeholder="Cargo" value={ejecutivo.cargo} onChange={e => setEjecutivo({ ...ejecutivo, cargo: e.target.value })} />
                            <input className="input-field" placeholder="Teléfono" value={ejecutivo.telefono} onChange={e => setEjecutivo({ ...ejecutivo, telefono: e.target.value })} />
                            <input className="input-field" placeholder="Correo" value={ejecutivo.correo} onChange={e => setEjecutivo({ ...ejecutivo, correo: e.target.value })} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card table-card">
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Items de la Cotización</h3>
                    <button onClick={addItem} className="btn-small">+ Añadir Item</button>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>N° Parte</th>
                            <th>Proveedor</th>
                            <th style={{ width: '70px' }}>Cant</th>
                            <th>Costo</th>
                            <th style={{ width: '70px' }}>Util%</th>
                            <th>Venta (Unit)</th>
                            <th>Total (c/IVA)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <select
                                        className="table-input"
                                        value={item.productoId}
                                        onChange={e => updateItem(item.id, 'productoId', e.target.value)}
                                    >
                                        <option value="">-- Producto --</option>
                                        {productos.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.nombre} {p.numPart ? `(${p.numPart})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <input
                                        className="table-input read-only-input"
                                        value={productos.find(p => p.id === item.productoId)?.numPart || ''}
                                        readOnly
                                        placeholder="-"
                                    />
                                </td>
                                <td>
                                    <select
                                        className="table-input"
                                        value={item.proveedorId}
                                        onChange={e => updateItem(item.id, 'proveedorId', e.target.value)}
                                    >
                                        <option value="">-- Proveedor --</option>
                                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </td>
                                <td><input className="table-input num" type="number" value={item.cantidad} onChange={e => updateItem(item.id, 'cantidad', Number(e.target.value))} /></td>
                                <td><input className="table-input num" type="number" value={item.costoUnitario} onChange={e => updateItem(item.id, 'costoUnitario', Number(e.target.value))} /></td>
                                <td><input className="table-input num" type="number" value={item.utilidad} onChange={e => updateItem(item.id, 'utilidad', Number(e.target.value))} /></td>
                                <td className="read-only">${calculateVenta(item).toLocaleString()}</td>
                                <td className="read-only font-bold">${calculateTotalItem(item).toLocaleString()}</td>
                                <td>
                                    <button className="btn-delete" onClick={() => setItems(items.filter(i => i.id !== item.id))}>×</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>SUBTOTAL:</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>${subtotalGeneral.toLocaleString()}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>IVA TOTAL:</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>${ivaGeneral.toLocaleString()}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>TOTAL COTIZACIÓN:</td>
                            <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-blue)', textAlign: 'right' }}>
                                ${grandTotal.toLocaleString()}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <style>{`
        .client-detail-box {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--background-light);
          border-radius: 6px;
          border: 1px dashed var(--border-color);
          font-size: 0.9rem;
        }
        .table-input {
          width: 100%;
          border: 1px solid var(--border-color);
          padding: 0.4rem;
          border-radius: 4px;
          background: white;
        }
        .read-only-input {
          background: var(--background-light);
          color: var(--text-muted);
          cursor: not-allowed;
          border: 1px solid transparent;
        }
        .module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; }
        .data-table th { background: var(--secondary-blue); color: var(--primary-blue); font-size: 0.85rem; font-weight: 600; }
        .num { text-align: right; }
        .read-only { text-align: right; color: var(--text-muted); font-size: 0.9rem; }
        .font-bold { font-weight: bold; color: var(--text-main); }
        .btn-success { background: var(--success); color: white; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; }
        .btn-success:disabled { background: #d1fae5; color: #6b7280; cursor: not-allowed; }
        .btn-delete { color: var(--error); border: none; background: none; font-size: 1.2rem; cursor: pointer; padding: 0 0.5rem; }
        .btn-delete:hover { color: #b91c1c; background: #fee2e2; border-radius: 4px; }
      `}</style>
        </div>
    );
};

export default CotizacionesModule;
