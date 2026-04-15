import React, { useState } from 'react';
import type { Cliente, Producto, Cotizacion, AppUser } from '../types/crm';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import ProductSearchSelect from '../components/ProductSearchSelect';

interface QuoteItem {
    id: string;
    productoId: string;
    proveedorId: string;
    unidad: string;
    cantidad: number;
    costoUnitario: number;
    precioVenta: number;
    utilidad: number;
    iva: number;
    moneda?: 'COP' | 'USD';
}

interface IProps {
    clientes: Cliente[];
    productos: Producto[];
    cotizaciones: Cotizacion[];
    onAddQuote: (q: any) => Promise<void>;
    onSendWhatsApp: (phone: string, msg: string) => void;
    currentUser: AppUser;
    currentTrm: number;
}

const CotizacionesModule: React.FC<IProps> = ({
    clientes,
    productos,
    cotizaciones,
    onAddQuote,
    onSendWhatsApp,
    currentUser,
    currentTrm
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
    const [selectedCompradorId, setSelectedCompradorId] = useState('');
    const [consecutivo, setConsecutivo] = useState(generateConsecutivo());
    const [observaciones, setObservaciones] = useState('');
    const [validezOferta, setValidezOferta] = useState(3);

    const getInitialCondiciones = (days: number) => `1. La descripción del producto y/o servicio, especifica el producto y/o servicio que se va a entregar, el cual incluye características técnicas y especificaciones relevantes. 
2. El valor unitario y el Valor total se expresa sin tener en cuenta impuestos, el valor del IVA se calcula y se indica en la casilla Valor IVA.
3. Condiciones y forma de pago: Anticipo ( ) Contado ( ) Crédito 30 días ( ) Crédito 45 días ( )
4. Los plazos de entrega de mercancía serán contemplados una vez se tenga confirmación de la propuesta o cotización por medio de correo electrónico y/o Orden de Compra: 1 día ( ) 2 días ( ) De 3 a 5 días ( ) de 6 a 10 días ( ) de 11 a 15 días ( ) 15 días o más ( ) Nota: Si son varias referencias se toma el más demorado.
5. Garantía, nuestros productos están sujetos a la política de garantía descritos en nuestra página WEB: POLITICAS DE GARANTIA
6. Condiciones de devolución y reembolso, se aceptan devoluciones en un plazo no mayor a 3 días y se debe retornar el producto a las instalaciones de la compañía, con la factura. Ver.
7. Validez de la cotización: Esta oferta tiene una validez de ${days} día(s) calendario a partir de la fecha de creación de este documento. Esto significa que las cantidades, descripciones y precios, dependerán de la validez de este documento.

Condiciones comerciales especiales:

Si la entrega de la mercancía se hace en un domicilio diferente al relacionado en los registros del ERP se debe informar y diligenciar y entregar la autorización despacho a terceros.

Proceso de compra:
1. Aprobación: Confirmación de la cotización o emisión de la orden de compra.
2. Verificación: Validación de la disponibilidad del producto.
3. Pago: Realizar el pago únicamente mediante transferencia bancaria a las siguientes cuentas:
Bancolombia - Cuenta de Ahorros N.º 00900002540
Davivienda – Cuenta Corriente No. 455469999011
BBVA - Cuenta Corriente No. 390021475`;

    const [condiciones, setCondiciones] = useState(getInitialCondiciones(3));
    const [ejecutivo, setEjecutivo] = useState({
        nombre: currentUser.nombre || '',
        cargo: currentUser.cargo || 'Ejecutivo Comercial',
        telefono: currentUser.telefono || '',
        correo: currentUser.email || ''
    });

    const selectedCliente = clientes.find(c => c.id === selectedClienteId);
    const selectedComprador = selectedCliente?.compradores?.find(comp => comp.id === selectedCompradorId);

    const addItem = () => {
        const newItem: QuoteItem = {
            id: crypto.randomUUID(),
            productoId: '',
            proveedorId: '',
            unidad: 'Und',
            cantidad: 1,
            costoUnitario: 0,
            precioVenta: 0,
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
                    let costo = prod?.precioCompra || 0;
                    const monedaItem = prod?.moneda || 'COP';

                    // Conversion logic if product is in USD
                    if (monedaItem === 'USD' && currentTrm > 0) {
                        costo = costo * currentTrm;

                        // Add TRM note if not present
                        if (!condiciones.includes('TRM')) {
                            setCondiciones(prev => prev + `\n\nNota: Los precios de productos en USD se convirtieron a COP usando una TRM de $${currentTrm.toLocaleString()}.`);
                        }
                    }

                    const defaultUtil = 15;
                    const defaultVenta = costo > 0 ? (costo / (1 - (defaultUtil / 100))) : 0;
                    return { ...item, productoId: value, costoUnitario: costo, precioVenta: defaultVenta, utilidad: defaultUtil, unidad: prod?.unidad || 'Und', iva: prod?.exentoIva ? 0 : 19, moneda: monedaItem };
                }
                if (field === 'costoUnitario') {
                    if (value === '') {
                        return { ...item, costoUnitario: '' as any, precioVenta: 0 };
                    }
                    const newCosto = Number(value);
                    const margin = Math.min(Number(item.utilidad) || 0, 99.99) / 100;
                    const newVenta = newCosto > 0 ? (newCosto / (1 - margin)) : 0;
                    return { ...item, costoUnitario: newCosto, precioVenta: newVenta };
                }
                if (field === 'utilidad') {
                    if (value === '') {
                        return { ...item, utilidad: '' as any };
                    }
                    const newUtil = Number(value);
                    const margin = Math.min(newUtil, 99.99) / 100;
                    const newVenta = Number(item.costoUnitario) > 0 ? (Number(item.costoUnitario) / (1 - margin)) : item.precioVenta;
                    return { ...item, utilidad: newUtil, precioVenta: newVenta };
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
                if (nuevoPrecioVenta <= 0) {
                    return { ...item, precioVenta: nuevoPrecioVenta, utilidad: 0 };
                }
                let newMargin = ((nuevoPrecioVenta - item.costoUnitario) / nuevoPrecioVenta) * 100;
                newMargin = Math.round(newMargin * 100) / 100;
                return { ...item, precioVenta: nuevoPrecioVenta, utilidad: newMargin };
            }
            return item;
        });
        setItems(newItems);
    };

    const calculateVenta = (item: QuoteItem) => item.precioVenta;

    const calculateMarginTotal = (item: QuoteItem) => {
        return (item.precioVenta - item.costoUnitario) * item.cantidad;
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

    // Actual margin percent based on total cost vs selling price
    const profitTotal = items.reduce((acc, item) => acc + calculateMarginTotal(item), 0);
    const totalCost = items.reduce((acc, item) => acc + (item.costoUnitario * item.cantidad), 0);
    const marginPercent = subtotalGeneral > 0
        ? ((subtotalGeneral - totalCost) / subtotalGeneral) * 100
        : 0;

    const generatePDF = async () => {
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
            // Save to DB (await completion)
            await onAddQuote({
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
                    precioVenta: item.precioVenta,
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
                compradorNombre: selectedComprador?.nombre,
                compradorTelefono: selectedComprador?.telefono,
                compradorEmail: selectedComprador?.correo,
                usuarioId: currentUser.id,
                estado: 'Seguimiento',
                requiereAutorizacion: marginPercent < 10,
                autorizada: false,
                condiciones: condiciones,
                validez_oferta: validezOferta,
                observaciones: observaciones,
                trm: currentTrm
            });

            // If margin >= 10, generate PDF
            if (marginPercent >= 10) {
                // Prepare client data for PDF with selected buyer if applicable
                const clientForPdf = { ...selectedCliente };
                if (selectedComprador) {
                    clientForPdf.contacto = selectedComprador.nombre;
                    clientForPdf.telefono = selectedComprador.telefono;
                    clientForPdf.correo = selectedComprador.correo;
                }

                generateQuotationPDF({
                    consecutivo,
                    cliente: clientForPdf as Cliente,
                    items,
                    productos,
                    subtotal: subtotalGeneral,
                    iva: ivaGeneral,
                    total: grandTotal,
                    condiciones,
                    validez: validezOferta,
                    observaciones,
                    ejecutivo
                });
            }

            // Optional: Reset local state after success
            setItems([]);
            setSelectedClienteId('');
            setConsecutivo(generateConsecutivo());
        } catch (error: any) {
            console.error("Error in generatePDF:", error);
            // Error is already alerted in addCotizacion if it's a Supabase error
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
                                onChange={e => {
                                    setSelectedClienteId(e.target.value);
                                    setSelectedCompradorId('');
                                }}
                            >
                                <option value="">-- Seleccionar Cliente --</option>
                                {clientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre} (NIT: {c.nit})</option>
                                ))}
                            </select>
                            {selectedCliente && selectedCliente.compradores && selectedCliente.compradores.length > 0 && (
                                <select
                                    className="input-field animate-fade-in"
                                    value={selectedCompradorId}
                                    onChange={e => setSelectedCompradorId(e.target.value)}
                                    style={{ border: '2px solid var(--primary-blue)' }}
                                >
                                    <option value="">-- Contacto Principal ({selectedCliente.contacto}) --</option>
                                    {selectedCliente.compradores.map(comp => (
                                        <option key={comp.id} value={comp.id}>
                                            👤 {comp.nombre} ({comp.cargo || 'Comprador'})
                                        </option>
                                    ))}
                                </select>
                            )}
                            <input className="input-field" type="date" value={new Date().toISOString().split('T')[0]} readOnly title="Fecha" />
                        </div>
                    </div>
                    <div>
                        <h3>Referencia y Validez</h3>
                        <div className="form-grid" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                className="input-field"
                                placeholder="N° Consecutivo"
                                value={consecutivo}
                                onChange={e => setConsecutivo(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 0.5 }}>
                                <label style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Validez:</label>
                                <select
                                    className="input-field"
                                    value={validezOferta}
                                    onChange={e => {
                                        const days = Number(e.target.value);
                                        setValidezOferta(days);
                                        setCondiciones(getInitialCondiciones(days));
                                    }}
                                    style={{ padding: '0.4rem' }}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                                        <option key={d} value={d}>{d} {d === 1 ? 'día' : 'días'}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                {selectedCliente && (
                    <div className="client-detail-box">
                        <p>
                            <strong>Contacto:</strong> {selectedComprador ? selectedComprador.nombre : selectedCliente.contacto} |
                            <strong>Tel:</strong> {selectedComprador ? selectedComprador.telefono : selectedCliente.telefono} |
                            <strong>Correo:</strong> {selectedComprador ? selectedComprador.correo : selectedCliente.correo} |
                            <strong>Dir:</strong> {selectedCliente.direccion}
                        </p>
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
                        <div style={{ marginTop: '1rem' }}>
                            <h3>Observaciones (Internas o para el PDF)</h3>
                            <textarea
                                className="input-field"
                                rows={4}
                                style={{ width: '100%', resize: 'vertical', marginTop: '0.5rem' }}
                                placeholder="Notas u observaciones adicionales que saldrán en el PDF..."
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                            />
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
                            <th style={{ width: '15%' }}>Producto</th>
                            <th style={{ width: '140px' }}>Cant</th>
                            <th style={{ width: '180px' }}>Costo</th>
                            <th style={{ width: '90px' }}>Util%</th>
                            <th style={{ width: '220px' }}>Venta (Unit)</th>
                            <th style={{ width: '70px' }}>IVA%</th>
                            <th>Valor IVA</th>
                            <th>Total (c/IVA)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <ProductSearchSelect
                                        productos={productos}
                                        value={item.productoId}
                                        onChange={(newId) => updateItem(item.id, 'productoId', newId)}
                                    />
                                </td>
                                <td><input className="table-input num" type="number" value={item.cantidad} onChange={e => updateItem(item.id, 'cantidad', Number(e.target.value))} /></td>
                                <td>
                                    <div style={{ position: 'relative' }}>
                                        <input className="table-input num"
                                            type="number"
                                            value={item.costoUnitario === undefined ? '' : item.costoUnitario}
                                            onChange={e => updateItem(item.id, 'costoUnitario', e.target.value)} />
                                        {item.moneda === 'USD' && (
                                            <span style={{ position: 'absolute', right: '5px', top: '-10px', fontSize: '0.65rem', color: '#0369a1', background: '#e0f2fe', padding: '1px 4px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                                                USD conv.
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <input
                                        className="table-input num"
                                        type="number"
                                        value={item.utilidad === undefined ? '' : item.utilidad}
                                        onChange={e => updateItem(item.id, 'utilidad', e.target.value)}
                                        step="0.01"
                                        title="Editar margen (calcula precio Venta)"
                                        style={{ background: 'white' }}
                                    />
                                </td>
                                <td>
                                    <input
                                        className="table-input num"
                                        style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}
                                        type="number"
                                        value={item.precioVenta}
                                        onChange={e => updateVenta(item.id, Number(e.target.value))}
                                        title="Editar precio Venta (calcula margen)"
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
                                <td className="read-only">${calculateIVAItem(item).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                                <td className="read-only font-bold">${calculateTotalItem(item).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                                <td>
                                    <button className="btn-delete" onClick={() => setItems(items.filter(i => i.id !== item.id))}>×</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>SUBTOTAL:</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>${subtotalGeneral.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>IVA TOTAL:</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>${ivaGeneral.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>UTILIDAD BRUTA ($):</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem 1rem', color: 'var(--success)', fontWeight: 'bold' }}>${profitTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>TOTAL COTIZACIÓN:</td>
                            <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary-blue)', textAlign: 'right' }}>
                                ${grandTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
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
