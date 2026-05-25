import type { Despacho, Cotizacion, Cliente } from '../App';

export const calculateDespachoNeto = (d: Despacho, cotizaciones: Cotizacion[], clientes: Cliente[] = []) => {
    const cot = cotizaciones.find(c => c.id === d.cotizacionId || c.consecutivo === d.consecutivoCotizacion);
    const client = clientes.find(c => c.id === d.clienteId);
    const isSimplificado = client?.regimen === 'Régimen Simplificado';
    const ivaDivisor = isSimplificado ? 1 : 1.19;

    let totalNeto = 0;

    if (!d.items || d.items.length === 0) {
        return d.total / ivaDivisor;
    }

    const availableQuoteItems = cot ? [...cot.items] : [];

    d.items.forEach((dItem: any) => {
        let itemNeto = 0;
        
        const qItemIndex = availableQuoteItems.findIndex(qi => 
            (qi.productoId && dItem.productoId && qi.productoId === dItem.productoId) || 
            (qi.id && dItem.productoId && qi.id === dItem.productoId)
        );

        let qItem = null;
        if (qItemIndex !== -1) {
            qItem = availableQuoteItems[qItemIndex];
            availableQuoteItems.splice(qItemIndex, 1);
        }

        if (qItem) {
            const costPrice = Number(qItem.costoUnitario || 0);
            const marginPercent = Number(qItem.utilidad || 0);
            let salePrice = Number(qItem.precioVenta || 0);
            
            if (salePrice <= 0) {
                salePrice = costPrice * (1 + (marginPercent / 100));
            }
            
            itemNeto = salePrice * (dItem.cantidad || 0);
        } else {
            itemNeto = (Number(dItem.precioVenta || 0)) * (dItem.cantidad || 0);
        }

        // Si sigue siendo 0, intentamos un fallback proporcional
        if (itemNeto === 0 && d.total > 0) {
            itemNeto = (d.total / ivaDivisor) / d.items.length;
        }

        totalNeto += itemNeto;
    });

    return totalNeto;
};
