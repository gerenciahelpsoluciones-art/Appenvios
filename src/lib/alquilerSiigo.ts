// Alquiler realmente facturado en Siigo en un mes, agrupado por cliente (NIT).
// Cuenta todo ítem cuya descripción diga alquiler / arrendamiento / renta: así entran tanto
// "ALQUILER PORTATIL ..." como "SERVICIO DE ALQUILER ..." (códigos 9659-*, 5556-*, 7846-MED*...).
// Regla de ATCG: en sus facturas el ítem "combo" también es alquiler.

export type LineaAlquilerSiigo = {
    facturaNumero: string;
    fecha: string;
    codigo: string;
    descripcion: string;
    cantidad: number;
    precio: number;
    total: number;
    esCombo: boolean;
};

export type AlquilerSiigoCliente = {
    nit: string;          // solo dígitos, sin dígito de verificación
    nombre: string;
    total: number;
    lineas: LineaAlquilerSiigo[];
};

const ES_ALQUILER = /alquil|arrend|\brenta\b/;
export const NIT_ATCG = '900423222';

// '900.423.222-9' → '900423222'; los NIT de Siigo llegan sin DV, los del CRM a veces con DV
export const normalizarNit = (nit: string | undefined | null) => {
    const s = String(nit || '').split('-')[0].replace(/\D/g, '');
    return s;
};

export const esLineaAlquiler = (descripcion: string, esAtcg: boolean) => {
    const d = descripcion.toLowerCase();
    return ES_ALQUILER.test(d) || (esAtcg && d.includes('combo'));
};

const descuento = (it: any) =>
    typeof it.discount === 'object' && it.discount !== null ? Number(it.discount.value) || 0 : Number(it.discount) || 0;

const anulada = (inv: any) => {
    const st = String(inv.status || '').toLowerCase();
    return st === 'canceled' || st === 'annulled' || inv.active === false || inv.annulled === true;
};

/** prefijoMes: 'YYYY-MM' */
export const alquilerFacturadoSiigo = (invoices: any[], prefijoMes: string) => {
    const porNit: Record<string, AlquilerSiigoCliente> = {};
    const vistas = new Set<string>();
    let total = 0;

    (invoices || []).forEach(inv => {
        const id = String(inv.id || inv.number || inv.name || '');
        if (!id || vistas.has(id)) return;
        vistas.add(id);
        if (anulada(inv) || !String(inv.date || '').startsWith(prefijoMes)) return;
        if (!Array.isArray(inv.items)) return;

        const nit = normalizarNit(inv.customer?.identification);
        const nombre = String(inv.customer?.name || inv.customer?.commercial_name || '').trim();
        const esAtcg = nit === NIT_ATCG || nombre.toLowerCase().includes('atcg');

        inv.items.forEach((it: any) => {
            const desc = String(it.description || it.name || '');
            if (!esLineaAlquiler(desc, esAtcg)) return;
            const cantidad = Number(it.quantity) || 1;
            const precio = Number(it.price) || 0;
            const monto = cantidad * precio - descuento(it);

            const key = nit || nombre || 'sin-nit';
            if (!porNit[key]) porNit[key] = { nit, nombre, total: 0, lineas: [] };
            porNit[key].total += monto;
            porNit[key].lineas.push({
                facturaNumero: inv.name || inv.number || 'Factura Siigo',
                fecha: inv.date || '',
                codigo: String(it.code || ''),
                descripcion: desc,
                cantidad,
                precio,
                total: monto,
                esCombo: !ES_ALQUILER.test(desc.toLowerCase()),
            });
            total += monto;
        });
    });

    return { total, porNit };
};
