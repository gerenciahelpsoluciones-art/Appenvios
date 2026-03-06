import React, { useState } from 'react';
import type { Cliente, Producto, Proveedor, Cotizacion, AppUser } from '../App';
import { generateQuotationPDF } from '../utils/pdfGenerator';

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
    cotizaciones: Cotizacion[];
    onAddQuote: (c: Cotizacion) => void;
    onUpdateQuote: (c: Cotizacion) => void;
    onSendWhatsApp: (phone: string, message: string) => void;
    currentUser: AppUser;
}

const CotizacionesModule: React.FC<IProps> = ({
    clientes,
    productos,
    proveedores,
    cotizaciones,
    onAddQuote,
    onUpdateQuote,
    onSendWhatsApp,
    currentUser
}) => {
    // Helper to generate dynamic consecutive
    const generateConsecutivo = () => {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const names = currentUser.nombre.trim().split(' ').filter(Boolean);
        const init1 = names[0] ? names[0][0].toUpperCase() : 'X';
        const init2 = names.length > 1 ? names[names.length - 1][0].toUpperCase() : (names[0] && names[0].length > 1 ? names[0][1].toUpperCase() : 'X');
        const initials = `${init1}${init2}`;
        const userQuotesCount = cotizaciones.filter(c => c.usuarioId === currentUser.id).length;
        const nextCounter = (userQuotesCount + 1).toString().padStart(3, '0');
        return `HSI-${initials}-${nextCounter}-${dateStr}`;
    };

    const [items, setItems] = useState<QuoteItem[]>([]);
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [consecutivo, setConsecutivo] = useState(generateConsecutivo());
    const initialCondiciones = `1. La descripción del producto y/o servicio, especifica el producto y/o servicio que se va a entregar, el cual incluye características técnicas y especificaciones relevantes. 
2. El valor unitario y el Valor total se expresa sin tener en cuenta impuestos, el valor del IVA se calcula y se indica en la casilla Valor IVA.
3. Condiciones y forma de pago: Anticipo ( ) Contado ( ) Crédito 30 días ( ) Crédito 45 días ( )
4. Los plazos de entrega de mercancía serán contemplados una vez se tenga confirmación de la propuesta o cotización por medio de correo electrónico y/o Orden de Compra: 1 día ( ) 2 días ( ) De 3 a 5 días ( ) de 6 a 10 días ( ) de 11 a 15 días ( ) 15 días o más ( ) Nota: Si son varias referencias se toma el más demorado.
5. Garantía, nuestros productos están sujetos a la política de garantía descritos en nuestra página WEB: POLITICAS DE GARANTIA
6. Condiciones de devolución y reembolso, se aceptan devoluciones en un plazo no mayor a 3 días y se debe retornar el producto a las instalaciones de la compañía, con la factura. Ver.
7. Validez de la cotización: Tiene valides por 1 día ( ) 2 días ( ) 3 días ( ) 5 días ( ) 15 días ( ) 1 mes ( )
Después de la fecha de creación de este documento, esto significa que las cantidades, descripciones y precios, dependerán de la validez de este documento.

Condiciones comerciales especiales:

Si la entrega de la mercancía se hace en un domicilio diferente al relacionado en los registros del ERP se debe informar y diligenciar y entregar la autorización despacho a terceros.

Proceso de compra:
1. Aprobación: Confirmación de la cotización o emisión de la orden de compra.
2. Verificación: Validación de la disponibilidad del producto.
3. Pago: Realizar el pago únicamente mediante transferencia bancaria a las siguientes cuentas:
Bancolombia - Cuenta de Ahorros N.º 00900002540
Davivienda – Cuenta Corriente No. 455469999011
BBVA - Cuenta Corriente No. 390021475`;

    const [condiciones, setCondiciones] = useState(initialCondiciones);
    const [ejecutivo, setEjecutivo] = useState({
        nombre: currentUser.nombre || '',
        cargo: currentUser.cargo || 'Ejecutivo Comercial',
        telefono: currentUser.telefono || '',
        correo: currentUser.email || ''
    });

    const selectedCliente = clientes.find(c => c.id === selectedClienteId);

    const addItem = () => {
        const newItem: QuoteItem = {
            id: crypto.randomUUID(),
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
                    return { ...item, productoId: value, costoUnitario: prod?.precioCompra || 0, unidad: prod?.unidad || 'Und', iva: prod?.exentoIva ? 0 : 19 };
                }
                return { ...item, [field]: value };
            }
            return item;
        });
        setItems(newItems);
    };

    const updateVenta = (id: string, nuevoPrecioVenta: number) => {
        const newItems = items.map(item => {
            if (item.id === id) {
                // If the sale price is 0 or less than the cost, the margin is 0 or negative.
                if (nuevoPrecioVenta <= 0) {
                    return { ...item, utilidad: 0 };
                }
                // Calculate margin percentage based on the formula: Margin % = ((Sale Price - Cost) / Sale Price) * 100
                // Example: Cost 100, Sale 150 -> Margin = ((150-100)/150)*100 = 33.33%
                let newMargin = ((nuevoPrecioVenta - item.costoUnitario) / nuevoPrecioVenta) * 100;

                // Truncate or round to 2 decimals to prevent infinite JS fractions
                newMargin = Math.round(newMargin * 100) / 100;

                return { ...item, utilidad: newMargin };
            }
            return item;
        });
        setItems(newItems);
    };

    const calculateVenta = (item: QuoteItem) => {
        // Limitar la utilidad máxima al 99.99% para evitar divisiones por cero o negativos.
        const margin = Math.min(item.utilidad, 99.99) / 100;
        return item.costoUnitario / (1 - margin);
    };

    const calculateMarginTotal = (item: QuoteItem) => {
        return (calculateVenta(item) - item.costoUnitario) * item.cantidad;
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

    // Average margin percent is weighted by subtotal
    const profitTotal = items.reduce((acc, item) => acc + calculateMarginTotal(item), 0);
    const marginPercent = items.reduce((acc, item) => acc + item.utilidad, 0) / (items.length || 1);

    const generatePDF = () => {
        if (!selectedCliente) {
            alert('Seleccione un cliente.');
            return;
        }

        if (items.length === 0) {
            alert('Agregue al menos un producto.');
            return;
        }

        // Block PDF generation if margin < 10%
        if (marginPercent < 10) {
            alert('🚫 ATENCIÓN: Esta cotización tiene un margen inferior al 10%. No es posible generar el PDF hasta que sea autorizada por el Gerente Comercial. La cotización se guardará en seguimiento.');
        }

        try {
            // Save to DB
            onAddQuote({
                id: crypto.randomUUID(),
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
                utilidadTotal: profitTotal,
                ejecutivo: ejecutivo.nombre,
                ejecutivoEmail: ejecutivo.correo,
                ejecutivoTelefono: ejecutivo.telefono,
                usuarioId: currentUser.id,
                estado: 'Seguimiento',
                requiereAutorizacion: marginPercent < 10,
                autorizada: false,
                condiciones: condiciones
            });

            // If margin >= 10, generate PDF
            if (marginPercent >= 10) {
                generateQuotationPDF({
                    consecutivo,
                    cliente: selectedCliente,
                    items,
                    productos,
                    subtotal: subtotalGeneral,
                    iva: ivaGeneral,
                    total: grandTotal,
                    condiciones,
                    ejecutivo
                });
            }
        } catch (error: any) {
            console.error("Error in generatePDF:", error);
            alert(`Error inesperado: ${error.message || 'Error desconocido'}`);
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
                            rows={15}
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
                            <th style={{ width: '70px' }}>Cant</th>
                            <th>Costo</th>
                            <th style={{ width: '70px' }}>Util%</th>
                            <th>Venta (Unit)</th>
                            <th style={{ width: '60px' }}>IVA%</th>
                            <th>Valor IVA</th>
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
                                <td><input className="table-input num" type="number" value={item.cantidad} onChange={e => updateItem(item.id, 'cantidad', Number(e.target.value))} /></td>
                                <td><input className="table-input num" type="number" value={item.costoUnitario} onChange={e => updateItem(item.id, 'costoUnitario', Number(e.target.value))} /></td>
                                <td><input className="table-input num" type="number" value={item.utilidad} onChange={e => updateItem(item.id, 'utilidad', Number(e.target.value))} step="0.01" /></td>
                                <td>
                                    <input
                                        className="table-input num"
                                        style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}
                                        type="number"
                                        value={Math.round(calculateVenta(item))}
                                        onChange={e => updateVenta(item.id, Number(e.target.value))}
                                    />
                                </td>
                                <td>
                                    <input
                                        className="table-input num"
                                        type="number"
                                        value={item.iva}
                                        onChange={e => updateItem(item.id, 'iva', Number(e.target.value))}
                                    />
                                </td>
                                <td className="read-only">${calculateIVAItem(item).toLocaleString()}</td>
                                <td className="read-only font-bold">${calculateTotalItem(item).toLocaleString()}</td>
                                <td>
                                    <button className="btn-delete" onClick={() => setItems(items.filter(i => i.id !== item.id))}>×</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>SUBTOTAL:</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>${subtotalGeneral.toLocaleString()}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>IVA TOTAL:</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>${ivaGeneral.toLocaleString()}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>UTILIDAD BRUTA ($):</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem 1rem', color: 'var(--success)', fontWeight: 'bold' }}>${profitTotal.toLocaleString()}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>TOTAL COTIZACIÓN:</td>
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
