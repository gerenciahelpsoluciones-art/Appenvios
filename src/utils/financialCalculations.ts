import type { Despacho, Cotizacion } from '../App';

export const calculateDespachoNeto = (d: Despacho, cotizaciones: Cotizacion[]) => {
    const cot = cotizaciones.find(c => c.id === d.cotizacionId || c.consecutivo === d.consecutivoCotizacion);
    let totalNeto = 0;

    if (!d.items || d.items.length === 0) {
        return d.total / 1.19;
    }

    d.items.forEach((dItem: any) => {
        let itemNeto = 0;
        const qItem = cot?.items.find(qi => 
            qi.productoId === dItem.productoId || 
            qi.id === dItem.productoId || 
            qi.nombre === dItem.nombre
        );

        if (qItem) {
            const costPrice = Number(qItem.costoUnitario || 0);
            const marginPercent = Number(qItem.utilidad || 0);
            let salePrice = Number(qItem.precioVenta || 0);
            
            if (salePrice <= 0 && marginPercent < 100) {
                salePrice = costPrice / (1 - (marginPercent / 100));
            } else if (salePrice <= 0) {
                salePrice = costPrice;
            }
            
            itemNeto = salePrice * (dItem.cantidad || 0);
        } else {
            itemNeto = (Number(dItem.precioVenta || 0)) * (dItem.cantidad || 0);
        }

        // Si sigue siendo 0, intentamos un fallback proporcional
        if (itemNeto === 0 && d.total > 0) {
            itemNeto = (d.total / 1.19) / d.items.length;
        }

        totalNeto += itemNeto;
    });

    return totalNeto;
};
