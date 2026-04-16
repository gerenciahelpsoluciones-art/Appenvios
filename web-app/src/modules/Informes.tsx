import React, { useState } from 'react';
import type { Cotizacion, SalesBudget, AppUser, Cliente, Producto, Proveedor, VentaManual } from '../types/crm';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { supabase } from '../lib/supabaseClient';

interface IProps {
    cotizaciones: Cotizacion[];
    ventasManuales: VentaManual[];
    budgets: SalesBudget[];
    currentUser: AppUser;
    onUpdateQuote: (quote: Cotizacion) => void;
    onDeleteQuote: (id: string) => void;
    clientes: Cliente[];
    productos: Producto[];
    proveedores: Proveedor[];
    despachos: any[];
    ordenesCompra: any[];
    users: AppUser[];
    alquileres?: Alquiler[];
}

interface EditItem {
    id: string;
    productoId: string;
    proveedorId: string;
    unidad: string;
    cantidad: number;
    costoUnitario: number;
    utilidad: number;
    precioVenta: number;
    iva: number;
}

const InformesModule: React.FC<IProps> = ({
    cotizaciones,
    ventasManuales,
    budgets,
    currentUser,
    onUpdateQuote,
    onDeleteQuote,
    clientes,
    productos,
    proveedores,
    despachos,
    ordenesCompra,
    users,
    alquileres = []
}) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth);
    const [fechaFin, setFechaFin] = useState(lastDayOfMonth);
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [selectedAsesorId, setSelectedAsesorId] = useState('');

    // Month for budget comparison
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // State for dates/filters that are actually being used for filtering
    // State for dates/filters that are actually being used for filtering
    const [appliedFilters, setAppliedFilters] = useState({ inicio: firstDayOfMonth, fin: lastDayOfMonth, clienteId: '', asesorId: '' });

    // Edit modal state
    const [editingQuote, setEditingQuote] = useState<Cotizacion | null>(null);
    const [editItems, setEditItems] = useState<EditItem[]>([]);
    const [editClienteId, setEditClienteId] = useState('');
    const [editObservaciones, setEditObservaciones] = useState('');
    const [editEjecutivo, setEditEjecutivo] = useState('');
    const [editEjecutivoEmail, setEditEjecutivoEmail] = useState('');
    const [editEjecutivoTelefono, setEditEjecutivoTelefono] = useState('');
    const [editCondiciones, setEditCondiciones] = useState('');

    // Won Quote OC Modal State
    const [wonQuoteModal, setWonQuoteModal] = useState<Cotizacion | null>(null);
    const [wonQuoteFile, setWonQuoteFile] = useState<File | null>(null);
    const [wonQuoteNumber, setWonQuoteNumber] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleSearch = () => {
        setAppliedFilters({ inicio: fechaInicio, fin: fechaFin, clienteId: selectedClienteId, asesorId: selectedAsesorId });
    };

    const filteredQuotes = cotizaciones.filter(q => {
        const dateMatch = q.fecha >= appliedFilters.inicio && q.fecha <= appliedFilters.fin;
        const clientMatch = appliedFilters.clienteId ? q.clienteId === appliedFilters.clienteId : true;
        const advisorMatch = appliedFilters.asesorId ? q.usuarioId === appliedFilters.asesorId : true;
        return dateMatch && clientMatch && advisorMatch;
    }).sort((a, b) => {
        const priority: Record<string, number> = { 'Seguimiento': 0, 'Perdido': 1, 'Ganado': 2 };
        const aStatus = a.estado || 'Seguimiento';
        const bStatus = b.estado || 'Seguimiento';
        const aPrio = priority[aStatus] ?? 10;
        const bPrio = priority[bStatus] ?? 10;
        
        if (aPrio !== bPrio) return aPrio - bPrio;
        
        // Safety check for dates
        const aDate = a.fecha || '';
        const bDate = b.fecha || '';
        return bDate.localeCompare(aDate);
    });

    const wonQuotesInRange = filteredQuotes.filter(q => q.estado === 'Ganado');
    const totalVendido = wonQuotesInRange.reduce((acc, q) => acc + q.total, 0);
    const totalUtilidad = wonQuotesInRange.reduce((acc, q) => acc + (q.utilidadTotal || 0), 0);

    // Revenue by category from manual sales (using appliedFilters)
    const manualSalesFiltered = (ventasManuales || []).filter(v => {
        const dateMatch = v.fecha >= appliedFilters.inicio && v.fecha <= appliedFilters.fin;
        const advisorMatch = appliedFilters.asesorId ? v.usuarioId === appliedFilters.asesorId : true;
        const clientMatch = appliedFilters.clienteId ? v.clienteId === appliedFilters.clienteId : true;
        return dateMatch && advisorMatch && clientMatch;
    });

    const revenueByContract = manualSalesFiltered
        .filter(v => v.tipoVenta === 'Contrato')
        .reduce((acc, v) => acc + v.monto, 0);
    
    const revenueByRental = manualSalesFiltered
        .filter(v => v.tipoVenta === 'Alquiler')
        .reduce((acc, v) => acc + v.monto, 0);
    
    const revenueByLicense = manualSalesFiltered
        .filter(v => v.tipoVenta === 'Licencia')
        .reduce((acc, v) => acc + v.monto, 0);
    
    const revenueByTenders = manualSalesFiltered
        .filter(v => v.tipoVenta === 'Licitacion')
        .reduce((acc, v) => acc + v.monto, 0);
    
    const revenueByStandard = manualSalesFiltered
        .filter(v => v.tipoVenta === 'Venta')
        .reduce((acc, v) => acc + v.monto, 0);

    // MRR (Monthly Recurring Revenue) from active rentals
    const activeRentals = (alquileres || []).filter(a => a.estado === 'Alquilado');
    const totalActiveRentalsSubtotal = activeRentals.reduce((sum, a) => sum + (a.valorMensual || 0), 0);

    // Total manual sales in period
    const totalManualSales = manualSalesFiltered.reduce((acc, v) => acc + v.monto, 0);

    // Monthly performance for execution cards (now based on appliedFilters for consistency)
    const monthlySales = totalVendido + totalManualSales;

    const revenueForMargin = monthlySales - revenueByContract;
    const profitMarginPercent = revenueForMargin > 0 ? (totalUtilidad / revenueForMargin) * 100 : 0;

    console.log('Informes Debug:', {
        totalReceivedManual: (ventasManuales || []).length,
        filteredManualSales: manualSalesFiltered.length,
        contractRevenue: revenueByContract,
        dateRange: { inicio: appliedFilters.inicio, fin: appliedFilters.fin },
        wonQuotes: wonQuotesInRange.length
    });

    const advisorFiltered = appliedFilters.asesorId;

    let activeBudget = 0;
    if (advisorFiltered) {
        // Individual advisor budget
        activeBudget = budgets.find(b =>
            b.usuarioId === advisorFiltered &&
            b.anio === currentYear &&
            b.mes === currentMonth
        )?.monto || 0;
    } else {
        // Global budget logic:
        // 1. Try to find explicit corporate budget first
        const corporateBudget = budgets.find(b =>
            b.usuarioId === 'company-total' &&
            b.anio === currentYear &&
            b.mes === currentMonth
        );

        if (corporateBudget) {
            activeBudget = corporateBudget.monto;
        } else {
            // 2. Fallback: Sum of all individual budgets for that month
            activeBudget = budgets
                .filter(b => b.usuarioId !== 'company-total' && b.anio === currentYear && b.mes === currentMonth)
                .reduce((acc, b) => acc + b.monto, 0);
        }
    }

    const executionPercent = activeBudget > 0 ? (monthlySales / activeBudget) * 100 : 0;
    const difference = monthlySales - activeBudget;

    const isAuthRequired = (q: Cotizacion) => {
        if (q.requiereAutorizacion) return true;
        if (q.subtotal > 0 && q.utilidadTotal !== undefined) {
            const margin = (q.utilidadTotal / q.subtotal) * 100;
            return margin < 10 && q.utilidadTotal < q.subtotal;
        }
        return false;
    };

    const updateStatus = (quote: Cotizacion, newStatus: 'Seguimiento' | 'Ganado' | 'Perdido') => {
        if (newStatus === 'Ganado') {
            if (isAuthRequired(quote) && !quote.autorizada) {
                alert('Esta cotización requiere autorización del Gerente Comercial debido a su bajo margen de utilidad (<10%).');
                return;
            }
            // Abre el modal para adjuntar la OC
            setWonQuoteModal(quote);
            setWonQuoteFile(null);
            setWonQuoteNumber('');
            return;
        }
        onUpdateQuote({ ...quote, estado: newStatus });
    };

    const handleConfirmWon = async () => {
        if (!wonQuoteModal) return;

        let publicUrl = '';
        if (wonQuoteFile) {
            setIsUploading(true);
            const timestamp = Date.now();
            const safeName = wonQuoteFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = `ordenes_cliente/${wonQuoteModal.id}_${timestamp}_${safeName}`;

            const { error: uploadError } = await supabase.storage
                .from('entregas')
                .upload(filePath, wonQuoteFile, { upsert: true });

            if (uploadError) {
                console.error('Error subiendo archivo OC:', uploadError);
                alert(`Error al subir archivo: ${uploadError.message}`);
                setIsUploading(false);
                return;
            }

            const { data: urlData } = supabase.storage
                .from('entregas')
                .getPublicUrl(filePath);

            publicUrl = urlData?.publicUrl || '';
        }

        onUpdateQuote({
            ...wonQuoteModal,
            estado: 'Ganado',
            ordenCompraCliente: wonQuoteNumber || undefined,
            ordenCompraUrl: publicUrl || undefined
        });
        setWonQuoteModal(null);
        setIsUploading(false);
        alert('Cotización marcada como Ganada exitosamente.');
    };

    const authorizeQuote = (quote: Cotizacion) => {
        if (!window.confirm('¿Está seguro de autorizar esta cotización con margen inferior al 10%?')) return;

        onUpdateQuote({
            ...quote,
            autorizada: true,
            autorizadoPor: currentUser.nombre,
            fechaAutorizacion: new Date().toISOString()
        });
        alert('Cotización autorizada correctamente.');
    };

    const handleDeleteQuote = (q: Cotizacion) => {
        if (!window.confirm(`¿Está seguro de eliminar de forma permanente la cotización ${q.consecutivo} de ${q.clienteNombre}?`)) return;
        onDeleteQuote(q.id);
    };

    const handlePrintPDF = (q: Cotizacion) => {
        if (isAuthRequired(q) && !q.autorizada) {
            alert('Esta cotización no puede imprimirse porque tiene un margen inferior al 10% y aún no ha sido autorizada por Gerencia.');
            return;
        }

        const client = clientes.find(c => c.id === q.clienteId);
        if (!client) {
            alert('Error: No se encontró la información del cliente.');
            return;
        }

        generateQuotationPDF({
            consecutivo: q.consecutivo,
            cliente: client,
            items: q.items,
            productos: productos,
            subtotal: q.subtotal,
            iva: q.iva,
            total: q.total,
            condiciones: q.condiciones || '1. Forma de pago: Contado.\n2. Tiempo de entrega: 3 a 5 días hábiles.\n3. Garantía: 12 meses por defectos de fábrica.',
            ejecutivo: {
                nombre: q.ejecutivo,
                cargo: 'Ejecutivo Comercial',
                telefono: q.ejecutivoTelefono || '',
                correo: q.ejecutivoEmail
            },
            validez: q.validez_oferta || '15 días',
            observaciones: q.observaciones,
            fecha: q.fecha
        });
    };

    // --- Edit Modal Helpers ---
    const openEditModal = (q: Cotizacion) => {
        setEditingQuote(q);
        setEditClienteId(q.clienteId);
        setEditItems((q.items || []).map(item => ({
            id: item.id,
            productoId: item.productoId,
            proveedorId: item.proveedorId,
            unidad: item.unidad,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            utilidad: Math.round(item.utilidad * 100) / 100,
            precioVenta: item.precioVenta || Math.round((item.costoUnitario / (1 - (item.utilidad / 100))) * 100) / 100,
            iva: item.iva,
        })));
        setEditObservaciones(q.observaciones || '');
        setEditEjecutivo(q.ejecutivo || '');
        setEditEjecutivoEmail(q.ejecutivoEmail || '');
        setEditEjecutivoTelefono(q.ejecutivoTelefono || '');
        setEditCondiciones(q.condiciones || '');
    };

    const closeEditModal = () => {
        setEditingQuote(null);
        setEditItems([]);
        setEditClienteId('');
        setEditObservaciones('');
        setEditEjecutivo('');
        setEditEjecutivoEmail('');
        setEditEjecutivoTelefono('');
        setEditCondiciones('');
    };

    const updateEditItem = (id: string, field: keyof EditItem, value: any) => {
        setEditItems(prev => prev.map(item => {
            if (item.id === id) {
                if (field === 'productoId') {
                    const prod = productos.find(p => p.id === value);
                    return { ...item, productoId: value, costoUnitario: prod?.precioCompra || 0, unidad: prod?.unidad || 'Und' };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const updateEditVenta = (id: string, nuevoPrecio: number) => {
        setEditItems(prev => prev.map(item => {
            if (item.id === id) {
                if (nuevoPrecio <= 0) return { ...item, precioVenta: nuevoPrecio, utilidad: 0 };
                const newMargin = Math.round(((nuevoPrecio - item.costoUnitario) / nuevoPrecio) * 10000) / 100;
                return { ...item, precioVenta: nuevoPrecio, utilidad: newMargin };
            }
            return item;
        }));
    };

    const addEditItem = () => {
        setEditItems(prev => [...prev, {
            id: crypto.randomUUID(),
            productoId: '',
            proveedorId: '',
            unidad: 'Und',
            cantidad: 1,
            costoUnitario: 0,
            utilidad: 15,
            iva: 19,
        }]);
    };

    const removeEditItem = (id: string) => {
        setEditItems(prev => prev.filter(i => i.id !== id));
    };

    const calcVenta = (item: EditItem) => item.precioVenta;
    const calcSubtotal = (item: EditItem) => calcVenta(item) * item.cantidad;
    const calcIVA = (item: EditItem) => calcSubtotal(item) * (item.iva / 100);
    const calcTotal = (item: EditItem) => calcSubtotal(item) + calcIVA(item);

    const editSubtotal = editItems.reduce((acc, i) => acc + calcSubtotal(i), 0);
    const editIVATotal = editItems.reduce((acc, i) => acc + calcIVA(i), 0);
    const editGrandTotal = editSubtotal + editIVATotal;

    const saveEdit = () => {
        if (!editingQuote) return;
        const cliente = clientes.find(c => c.id === editClienteId);
        const updated: Cotizacion = {
            ...editingQuote,
            clienteId: editClienteId,
            clienteNombre: cliente?.nombre || editingQuote.clienteNombre,
            items: editItems.map(i => ({
                id: i.id,
                productoId: i.productoId,
                proveedorId: i.proveedorId,
                unidad: i.unidad,
                cantidad: i.cantidad,
                costoUnitario: i.costoUnitario,
                utilidad: i.utilidad,
                precioVenta: i.precioVenta,
                iva: i.iva,
            })),
            subtotal: editSubtotal,
            iva: editIVATotal,
            total: editGrandTotal,
            observaciones: editObservaciones,
            ejecutivo: editEjecutivo,
            ejecutivoEmail: editEjecutivoEmail,
            ejecutivoTelefono: editEjecutivoTelefono,
            condiciones: editCondiciones
        };
        onUpdateQuote(updated);
        closeEditModal();
    };

    // --- Profit Analysis Grouping ---
    const profitByClient = wonQuotesInRange.reduce((acc: Record<string, { nombre: string, total: number, profit: number }>, q) => {
        if (!acc[q.clienteId]) acc[q.clienteId] = { nombre: q.clienteNombre, total: 0, profit: 0 };
        acc[q.clienteId].total += q.total;
        acc[q.clienteId].profit += (q.utilidadTotal || 0);
        return acc;
    }, {});

    const profitByMonth = wonQuotesInRange.reduce((acc: Record<string, { total: number, profit: number }>, q) => {
        const month = q.fecha.substring(0, 7); // YYYY-MM
        if (!acc[month]) acc[month] = { total: 0, profit: 0 };
        acc[month].total += q.total;
        acc[month].profit += (q.utilidadTotal || 0);
        return acc;
    }, {});


    return (
        <div className="reports-container">
            <div className="card filters-card">
                <h3>Resumen de Rendimiento ({appliedFilters.inicio} a {appliedFilters.fin})</h3>
                <div className="stats-grid">
                    {(!appliedFilters.asesorId ? (
                        currentUser.rol === 'Admin' || 
                        currentUser.cargo?.toLowerCase().includes('administrador') || 
                        currentUser.cargo?.toLowerCase().includes('logistica') || 
                        currentUser.cargo?.toLowerCase().includes('gerente comercial')
                    ) : true) && (
                        <div className="stat-card budget-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                            <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>Presupuesto Mensual {appliedFilters.asesorId ? 'Personal' : 'Empresa'}</div>
                            <div className="stat-value" style={{ fontSize: '1.2rem', color: '#fff' }}>${activeBudget.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                            <div className="stat-trend" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>Meta asignada</div>
                        </div>
                    )}
                    <div className="stat-card sales-card">
                        <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>Ventas Logradas (Total)</div>
                        <div className="stat-value" style={{ fontSize: '1.2rem', color: '#fff' }}>${monthlySales.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                        <div className="stat-trend" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>Ejecutado</div>
                    </div>
                    <div className="stat-card percent-card">
                        <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>% Ejecución</div>
                        <div className="stat-value" style={{ fontSize: '1.2rem', color: '#fff' }}>{executionPercent.toFixed(1)}%</div>
                        <div className="stat-trend" style={{ background: difference >= 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,0,0,0.3)', color: '#fff' }}>
                            {difference >= 0 ? `+ $${difference.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : `- $${Math.abs(difference).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
                        </div>
                    </div>
                    <div className="stat-card profit-summary-card">
                        <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>Utilidad en Rango</div>
                        <div className="stat-value" style={{ fontSize: '1.2rem', color: '#fff' }}>${totalUtilidad.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                        <div className="stat-trend" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>Margen Bruto</div>
                    </div>
                    <div className="stat-card margin-percent-card" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' }}>
                        <div className="stat-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>Porcentaje de Utilidad</div>
                        <div className="stat-value" style={{ fontSize: '1.2rem', color: '#fff' }}>{profitMarginPercent.toFixed(1)}%</div>
                        <div className="stat-trend" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>Sobre Ventas Totales</div>
                    </div>
                    {currentUser.rol === 'Admin' && (
                        <>
                            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: '0.2rem' }}>Ingresos por Contratos</div>
                                <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, margin: '0.15rem 0' }}>${revenueByContract.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                                <div className="stat-trend" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.68rem' }}>En el periodo</div>
                            </div>
                            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: '0.2rem' }}>Punto de Equilibrio: Alquileres</div>
                                <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, margin: '0.15rem 0' }}>Total del Periodo: ${revenueByRental.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,1)', fontWeight: 'bold' }}>Subtotal Activo Actual: ${totalActiveRentalsSubtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} / mes</div>
                                <div className="stat-trend" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.68rem' }}>{activeRentals.length} equipos alquilados actualmente</div>
                            </div>
                            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: '0.2rem' }}>Ventas Estándar</div>
                                <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, margin: '0.15rem 0' }}>${revenueByStandard.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                                <div className="stat-trend" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.68rem' }}>En el periodo</div>
                            </div>
                            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: '0.2rem' }}>Licitaciones</div>
                                <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, margin: '0.15rem 0' }}>${revenueByTenders.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                                <div className="stat-trend" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.68rem' }}>En el periodo</div>
                            </div>
                            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #c084fc 0%, #9333ea 100%)' }}>
                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: '0.2rem' }}>Licenciamiento</div>
                                <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700, margin: '0.15rem 0' }}>${revenueByLicense.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                                <div className="stat-trend" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.68rem' }}>En el periodo</div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="card filters-card" style={{ marginTop: '1.5rem' }}>
                <h3>Filtrar Cotizaciones por Fecha</h3>
                <div className="filter-group">
                    <div className="input-box">
                        <label>Fecha Inicio</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                    </div>
                    <div className="input-box">
                        <label>Fecha Fin</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                        />
                    </div>
                    <div className="input-box" style={{ flex: 2 }}>
                        <label>Cliente</label>
                        <select
                            className="input-field"
                            style={{ width: '100%', height: '42px', padding: '0 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            value={selectedClienteId}
                            onChange={e => setSelectedClienteId(e.target.value)}
                        >
                            <option value="">-- Todos los Clientes --</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-box" style={{ flex: 2 }}>
                        <label>Asesor Comercial</label>
                        <select
                            className="input-field"
                            style={{ width: '100%', height: '42px', padding: '0 0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            value={selectedAsesorId}
                            onChange={e => setSelectedAsesorId(e.target.value)}
                        >
                            <option value="">-- Todos los Asesores --</option>
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
                                    <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                                ))}
                        </select>
                    </div>
                    <div className="button-box">
                        <button className="btn btn-primary btn-search" onClick={handleSearch}>
                            🔍 Buscar
                        </button>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card stat-card">
                    <h4>Total en el Rango</h4>
                    <p className="stat-value">${totalVendido.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                    <span className="stat-label">
                        {appliedFilters.inicio} al {appliedFilters.fin} {appliedFilters.clienteId ? `• ${clientes.find(c => c.id === appliedFilters.clienteId)?.nombre}` : ''} • {filteredQuotes.length} cotizaciones
                    </span>
                </div>
                <div className="card stat-card" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white' }}>
                    <h4>Utilidad en el Rango</h4>
                    <p className="stat-value" style={{ color: 'white' }}>${totalUtilidad.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                    <span className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Margen de ganancia acumulado
                    </span>
                </div>
            </div>

            {/* ========== PROFIT ANALYSIS SECTION ========== */}
            <div className="dashboard-grid">
                <div className="card">
                    <h3>Utilidad por Cliente</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th className="text-right">Ventas</th>
                                    <th className="text-right">Utilidad</th>
                                    <th className="text-right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(profitByClient).sort((a, b) => b.profit - a.profit).map((c, i) => (
                                    <tr key={i}>
                                        <td>{c.nombre}</td>
                                        <td className="text-right">${c.total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                        <td className="text-right" style={{ color: 'var(--success)', fontWeight: 'bold' }}>${c.profit.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                        <td className="text-right">{(c.profit / (c.total || 1) * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ========== LOGISTICS ANALYSIS SECTION ========== */}
                {(currentUser.rol === 'Admin' || currentUser.rol === 'Logistica' || currentUser.cargo?.toLowerCase().includes('administrador')) && (
                    <div className="card" style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>📊 Informe de Logística</h3>
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Basado en filtros aplicados</span>
                        </div>

                        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                <div className="stat-label">Total Entregas (Despachos)</div>
                                <div className="stat-value">
                                    {despachos.filter(d =>
                                        d.fechaSolicitud >= appliedFilters.inicio &&
                                        d.fechaSolicitud <= appliedFilters.fin &&
                                        (appliedFilters.asesorId ? d.usuarioId === appliedFilters.asesorId : true) &&
                                        (appliedFilters.clienteId ? d.clienteId === appliedFilters.clienteId : true)
                                    ).length}
                                </div>
                                <div className="stat-trend">En el periodo</div>
                            </div>
                            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
                                <div className="stat-label">Total Recogidas (Logística)</div>
                                <div className="stat-value">
                                    {ordenesCompra.filter(oc =>
                                        oc.tipo === 'Recogida' &&
                                        oc.fecha >= appliedFilters.inicio &&
                                        oc.fecha <= appliedFilters.fin &&
                                        (appliedFilters.asesorId ? oc.usuarioId === appliedFilters.asesorId : true)
                                    ).length}
                                </div>
                                <div className="stat-trend">En el periodo</div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '0', border: 'none', boxShadow: 'none' }}>
                            <h4>Detalle de Logística por Asesor</h4>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Asesor Comercial</th>
                                            <th className="text-center">Entregas</th>
                                            <th className="text-center">Recogidas</th>
                                            <th className="text-center">Total Operaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => {
                                            const userEntregas = despachos.filter(d =>
                                                d.usuarioId === user.id &&
                                                d.fechaSolicitud >= appliedFilters.inicio &&
                                                d.fechaSolicitud <= appliedFilters.fin &&
                                                (appliedFilters.clienteId ? d.clienteId === appliedFilters.clienteId : true)
                                            ).length;

                                            const userRecogidas = ordenesCompra.filter(oc =>
                                                oc.tipo === 'Recogida' &&
                                                oc.usuarioId === user.id &&
                                                oc.fecha >= appliedFilters.inicio &&
                                                oc.fecha <= appliedFilters.fin
                                            ).length;

                                            if (userEntregas === 0 && userRecogidas === 0) return null;
                                            if (appliedFilters.asesorId && appliedFilters.asesorId !== user.id) return null;

                                            return (
                                                <tr key={user.id}>
                                                    <td><strong>{user.nombre}</strong></td>
                                                    <td className="text-center">{userEntregas}</td>
                                                    <td className="text-center">{userRecogidas}</td>
                                                    <td className="text-center" style={{ fontWeight: 'bold', color: 'var(--primary-blue)' }}>
                                                        {userEntregas + userRecogidas}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}



                <div className="card">
                    <h3>Utilidad por Mes</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Mes</th>
                                    <th className="text-right">Ventas</th>
                                    <th className="text-right">Utilidad</th>
                                    <th className="text-right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(profitByMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, data], i) => (
                                    <tr key={i}>
                                        <td>{month}</td>
                                        <td className="text-right">${data.total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                        <td className="text-right" style={{ color: 'var(--success)', fontWeight: 'bold' }}>${data.profit.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                        <td className="text-right">{(data.profit / (data.total || 1) * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Listado de Cotizaciones</h3>
                    <span style={{ fontSize: '0.7rem', background: 'var(--primary-blue)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '10px', fontWeight: 'bold' }}>v2.0 - ALTA PRECISIÓN</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '100px' }}>Fecha</th>
                                <th style={{ minWidth: '150px' }}>Consecutivo</th>
                                <th style={{ minWidth: '220px' }}>Cliente</th>
                                <th className="text-right" style={{ minWidth: '120px' }}>Subtotal</th>
                                <th className="text-right" style={{ minWidth: '120px' }}>Utilidad</th>
                                <th className="text-right" style={{ minWidth: '110px' }}>IVA</th>
                                <th className="text-right" style={{ minWidth: '130px' }}>Total</th>
                                <th style={{ minWidth: '160px' }}>Ejecutivo</th>
                                <th className="text-center" style={{ minWidth: '120px' }}>Estado</th>
                                <th className="text-center" style={{ minWidth: '110px' }}>Autorización</th>
                                <th className="text-center" style={{ minWidth: '230px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotes.length > 0 ? (
                                filteredQuotes.map((q) => (
                                    <tr key={q.id}>
                                        <td>{q.fecha}</td>
                                        <td><strong>{q.consecutivo}</strong></td>
                                        <td>{q.clienteNombre}</td>
                                        <td className="text-right">${q.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                        <td className="text-right" style={{ color: 'var(--success)', fontWeight: 'bold' }}>${(q.utilidadTotal || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                        <td className="text-right">${q.iva.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                        <td className="text-right"><strong>${q.total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</strong></td>
                                        <td>{q.ejecutivo}</td>
                                        <td className="text-center">
                                            <span className={`status-badge status-${(q.estado || 'Seguimiento').toLowerCase()}`}>
                                                {q.estado || 'Seguimiento'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {isAuthRequired(q) ? (
                                                <span className={`auth-badge ${q.autorizada ? 'auth-ok' : 'auth-pending'}`}>
                                                    {q.autorizada ? '✅ OK' : '⚠️ Pendiente'}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>N/A</span>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <div className="status-actions">
                                                <button
                                                    className="btn-status btn-edit-quote"
                                                    onClick={() => openEditModal(q)}
                                                    title="Editar Cotización"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-status"
                                                    style={{ background: '#f1f5f9', color: '#444', border: '1px solid #cbd5e1' }}
                                                    onClick={() => handlePrintPDF(q)}
                                                    title="Imprimir PDF"
                                                >
                                                    🖨️
                                                </button>
                                                {(currentUser.rol === 'Admin' || currentUser.cargo?.toLowerCase().includes('administrador')) && (
                                                    <button
                                                        className="btn-status btn-perdido"
                                                        style={{ background: '#fee2e2', border: '1px solid #fecaca' }}
                                                        onClick={() => handleDeleteQuote(q)}
                                                        title="Eliminar Cotización (Sólo Admin)"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-status btn-seguimiento"
                                                    onClick={() => updateStatus(q, 'Seguimiento')}
                                                    title="Seguimiento"
                                                >
                                                    ⏳
                                                </button>
                                                <button
                                                    className="btn-status btn-ganado"
                                                    onClick={() => updateStatus(q, 'Ganado')}
                                                    title="Ganado"
                                                    style={{ opacity: (isAuthRequired(q) && !q.autorizada) ? 0.3 : 1 }}
                                                >
                                                    ✅
                                                </button>
                                                {(currentUser.rol === 'Admin' || currentUser.cargo?.toLowerCase().includes('gerente') || currentUser.cargo?.toLowerCase().includes('administrador')) && isAuthRequired(q) && !q.autorizada && (
                                                    <button
                                                        className="btn-status btn-authorize"
                                                        onClick={() => authorizeQuote(q)}
                                                        title="Autorizar Margen"
                                                        style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}
                                                    >
                                                        🔑
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-status btn-perdido"
                                                    onClick={() => updateStatus(q, 'Perdido')}
                                                    title="Perdido"
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        No se encontraron cotizaciones en este rango de fechas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========== WON QUOTE OC MODAL ========== */}
            {wonQuoteModal && (
                <div className="modal-overlay" onClick={() => !isUploading && setWonQuoteModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h3>🏆 Ganar Cotización {wonQuoteModal.consecutivo}</h3>
                            <button className="modal-close" onClick={() => !isUploading && setWonQuoteModal(null)} disabled={isUploading}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem 0' }}>
                            <p style={{ marginBottom: '1rem', color: '#4b5563', fontSize: '0.95rem' }}>
                                ¡Felicidades por cerrar este negocio con <strong>{wonQuoteModal.clienteNombre}</strong>!
                                Por favor adjunte la Orden de Compra del cliente (Opcional).
                            </p>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Número de Orden de Compra (O.C.)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ej: OC-12345"
                                    value={wonQuoteNumber}
                                    onChange={e => setWonQuoteNumber(e.target.value)}
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Archivo de Orden de Compra (PDF/Imagen)</label>
                                <input
                                    type="file"
                                    className="input-field"
                                    accept=".pdf,image/*"
                                    onChange={e => setWonQuoteFile(e.target.files?.[0] || null)}
                                    disabled={isUploading}
                                />
                                {wonQuoteFile && <small style={{ color: '#059669', display: 'block', marginTop: '0.5rem' }}>✓ Archivo listo para subir</small>}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                                <button
                                    className="btn-cancel"
                                    onClick={() => setWonQuoteModal(null)}
                                    disabled={isUploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn-save"
                                    style={{ background: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={handleConfirmWon}
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Subiendo...' : 'Confirmar Ganado'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== EDIT MODAL ========== */}
            {editingQuote && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>✏️ Editar Cotización {editingQuote.consecutivo}</h3>
                            <button className="modal-close" onClick={closeEditModal}>×</button>
                        </div>

                        <div className="modal-body">
                            {/* Client selector */}
                            <div className="edit-section">
                                <label className="edit-label">Cliente</label>
                                <select className="edit-select" value={editClienteId} onChange={e => setEditClienteId(e.target.value)}>
                                    <option value="">-- Seleccionar Cliente --</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} (NIT: {c.nit})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Executive Info */}
                            <div className="edit-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div className="edit-section" style={{ marginBottom: 0 }}>
                                    <label className="edit-label">Ejecutivo Comercial</label>
                                    <input className="edit-input" type="text" value={editEjecutivo} onChange={e => setEditEjecutivo(e.target.value)} placeholder="Nombre del ejecutivo" />
                                </div>
                                <div className="edit-section" style={{ marginBottom: 0 }}>
                                    <label className="edit-label">Email Ejecutivo</label>
                                    <input className="edit-input" type="email" value={editEjecutivoEmail} onChange={e => setEditEjecutivoEmail(e.target.value)} placeholder="Email de contacto" />
                                </div>
                                <div className="edit-section" style={{ marginBottom: 0 }}>
                                    <label className="edit-label">Teléfono Ejecutivo</label>
                                    <input className="edit-input" type="text" value={editEjecutivoTelefono} onChange={e => setEditEjecutivoTelefono(e.target.value)} placeholder="WhatsApp / Cel" />
                                </div>
                            </div>

                            {/* Items table */}
                            <div className="edit-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <label className="edit-label" style={{ margin: 0 }}>Items</label>
                                    <button className="btn-add-item" onClick={addEditItem}>+ Añadir Item</button>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="edit-table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Proveedor</th>
                                                <th style={{ width: '65px' }}>Cant</th>
                                                <th style={{ width: '90px' }}>Costo</th>
                                                <th style={{ width: '60px' }}>Util%</th>
                                                <th style={{ width: '60px' }}>IVA%</th>
                                                <th>Venta</th>
                                                <th>Total</th>
                                                <th style={{ width: '40px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editItems.map(item => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <select className="edit-input" value={item.productoId} onChange={e => updateEditItem(item.id, 'productoId', e.target.value)}>
                                                            <option value="">-- Producto --</option>
                                                            {productos.map(p => (
                                                                <option key={p.id} value={p.id}>{p.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <select className="edit-input" value={item.proveedorId} onChange={e => updateEditItem(item.id, 'proveedorId', e.target.value)}>
                                                            <option value="">-- Prov --</option>
                                                            {proveedores.map(p => (
                                                                <option key={p.id} value={p.id}>{p.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td><input className="edit-input num" type="number" value={item.cantidad} onChange={e => updateEditItem(item.id, 'cantidad', Number(e.target.value))} /></td>
                                                    <td><input className="edit-input num" type="number" step="0.01" value={item.costoUnitario} onChange={e => updateEditItem(item.id, 'costoUnitario', Number(e.target.value))} /></td>
                                                    <td><input className="edit-input num" type="number" step="0.01" value={item.utilidad} onChange={e => updateEditItem(item.id, 'utilidad', Number(e.target.value))} /></td>
                                                    <td><input className="edit-input num" type="number" step="0.01" value={item.iva} onChange={e => updateEditItem(item.id, 'iva', Number(e.target.value))} /></td>
                                                    <td>
                                                        <input
                                                            className="edit-input num"
                                                            type="number"
                                                            value={item.precioVenta}
                                                            onChange={e => updateEditVenta(item.id, Number(e.target.value))}
                                                            style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}
                                                        />
                                                    </td>
                                                    <td className="ro bold">${calcTotal(item).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                                    <td><button className="btn-remove-item" onClick={() => removeEditItem(item.id)}>×</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Observations */}
                            <div className="edit-section" style={{ marginTop: '1rem' }}>
                                <label className="edit-label">Observaciones (Saldrán en el PDF)</label>
                                <textarea
                                    className="edit-input"
                                    rows={2}
                                    style={{ resize: 'vertical' }}
                                    value={editObservaciones}
                                    onChange={e => setEditObservaciones(e.target.value)}
                                    placeholder="Notas adicionales para esta cotización..."
                                />
                            </div>

                            {/* Commercial Conditions */}
                            <div className="edit-section" style={{ marginTop: '1rem' }}>
                                <label className="edit-label">Condiciones Comerciales</label>
                                <textarea
                                    className="edit-input"
                                    rows={4}
                                    style={{ resize: 'vertical' }}
                                    value={editCondiciones}
                                    onChange={e => setEditCondiciones(e.target.value)}
                                    placeholder="1. Forma de pago...\n2. Tiempo de entrega..."
                                />
                            </div>

                            {/* Totals */}
                            <div className="edit-totals">
                                <div className="total-row"><span>Subtotal:</span><span>${editSubtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span></div>
                                <div className="total-row"><span>IVA:</span><span>${editIVATotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span></div>
                                <div className="total-row grand"><span>TOTAL:</span><span>${editGrandTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span></div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={closeEditModal}>Cancelar</button>
                            <button className="btn-save" onClick={saveEdit} disabled={editItems.length === 0}>💾 Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1rem;
                }
                .stat-card {
                    padding: 1.25rem;
                    border-radius: 12px;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .budget-card { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
                .sales-card { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
                .percent-card { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                .profit-summary-card { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
                .stat-label { font-size: 0.85rem; opacity: 0.9; }
                .stat-value { font-size: 1.5rem; font-weight: 800; }
                .stat-trend { font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 0.2rem 0.6rem; border-radius: 20px; align-self: flex-start; }

                .reports-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .filter-group {
                    display: flex;
                    gap: 1.5rem;
                    margin-top: 1rem;
                    align-items: flex-end;
                }
                .input-box {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .input-box input {
                    padding: 0.6rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                }
                .btn-search {
                    padding: 0.7rem 2rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    height: 42px;
                }
                .btn-search:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .text-right {
                    text-align: right;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .data-table thead {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background-color: #f1f5f9;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .data-table th, .data-table td {
                    border: 1px solid var(--border-color);
                    padding: 0.75rem 1rem;
                }
                .data-table th {
                    text-align: left;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    color: var(--primary-blue);
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }
                .data-table tbody tr {
                    transition: background-color 0.2s;
                }
                .data-table tbody tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .data-table tbody tr:hover {
                    background-color: #f0f9ff;
                }
                .data-table th.text-right {
                    text-align: right;
                }
                .data-table td.text-right {
                    font-family: 'Courier New', Courier, monospace;
                    font-weight: 500;
                }
                .status-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .status-seguimiento { background-color: #fef3c7; color: #92400e; }
                .status-ganado { background-color: #d1fae5; color: #065f46; }
                .status-perdido { background-color: #fee2e2; color: #991b1b; }
                
                .status-actions {
                    display: flex;
                    gap: 0.25rem;
                    justify-content: center;
                }
                .btn-status {
                    border: none;
                    background: none;
                    cursor: pointer;
                    padding: 0.2rem;
                    border-radius: 4px;
                    font-size: 1rem;
                    transition: background 0.2s;
                }
                .btn-status:hover {
                    background: var(--background-light);
                }
                .btn-seguimiento:hover { background: #fef3c7; }
                .btn-ganado:hover { background: #d1fae5; }
                .btn-perdido:hover { background: #fee2e2; }
                .btn-edit-quote { font-size: 1rem; }
                .btn-edit-quote:hover { background: #dbeafe !important; }

                /* ---- Edit Modal ---- */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                .modal-content {
                    background: white;
                    border-radius: 16px;
                    width: 90vw;
                    max-width: 1000px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                    animation: slideUp 0.3s ease;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    background: linear-gradient(135deg, #004a99 0%, #0066cc 100%);
                    color: white;
                    border-radius: 16px 16px 0 0;
                }
                .modal-header h3 { margin: 0; font-size: 1.1rem; }
                .modal-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    font-size: 1.4rem;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                .modal-close:hover { background: rgba(255,255,255,0.35); }
                .modal-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--border-color);
                    background: #f9fafb;
                    border-radius: 0 0 16px 16px;
                }
                .edit-section {
                    margin-bottom: 1.25rem;
                }
                .edit-label {
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                    display: block;
                    color: #374151;
                }
                .edit-select {
                    width: 100%;
                    padding: 0.6rem;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    font-size: 0.9rem;
                }
                .edit-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                }
                .edit-table th {
                    background: #f1f5f9;
                    padding: 0.5rem;
                    text-align: left;
                    font-weight: 600;
                    font-size: 0.78rem;
                    color: #475569;
                    border-bottom: 2px solid #e2e8f0;
                }
                .edit-table td {
                    padding: 0.35rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .edit-input {
                    width: 100%;
                    padding: 0.35rem 0.4rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    transition: border 0.2s;
                }
                .edit-input:focus {
                    border-color: #3b82f6;
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
                }
                .edit-input.num { text-align: right; width: 100%; }
                .ro { text-align: right; color: #6b7280; font-size: 0.85rem; padding: 0.35rem 0.5rem !important; }
                .bold { font-weight: 700; color: #111827; }
                .btn-add-item {
                    background: #dbeafe;
                    color: #1d4ed8;
                    border: none;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.8rem;
                    transition: background 0.2s;
                }
                .btn-add-item:hover { background: #bfdbfe; }
                .btn-remove-item {
                    background: none;
                    border: none;
                    color: #ef4444;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }
                .btn-remove-item:hover { color: #b91c1c; }

                .edit-totals {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.35rem;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e2e8f0;
                }
                .total-row {
                    display: flex;
                    gap: 2rem;
                    font-size: 0.9rem;
                    color: #6b7280;
                }
                .total-row span:last-child { font-weight: 600; min-width: 120px; text-align: right; }
                .total-row.grand {
                    font-size: 1.1rem;
                    color: #004a99;
                    font-weight: 800;
                    margin-top: 0.25rem;
                    padding-top: 0.5rem;
                    border-top: 2px solid #004a99;
                }
                .btn-cancel {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                    padding: 0.6rem 1.25rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }
                .btn-cancel:hover { background: #e5e7eb; }
                .btn-save {
                    background: linear-gradient(135deg, #004a99, #0066cc);
                    color: white;
                    border: none;
                    padding: 0.6rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: transform 0.15s, box-shadow 0.15s;
                }
                .btn-save:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,74,153,0.3); }
                .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
                
                .auth-badge { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold; display: inline-block; }
                .auth-ok { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
                .auth-pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
                .status-ganado { background: #dcfce7; color: #166534; }
                .status-perdido { background: #fee2e2; color: #991b1b; }
            `}</style>
        </div>
    );
};

export default InformesModule;
