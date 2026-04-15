import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../assets/logoBase64';
import type { Cliente, Producto } from '../types/crm';

export interface PDFData {
    consecutivo: string;
    cliente: Cliente;
    items: any[];
    productos: Producto[];
    subtotal: number;
    iva: number;
    total: number;
    condiciones: string;
    validez: string;
    ejecutivo: {
        nombre: string;
        cargo: string;
        telefono: string;
        correo: string;
    };
    observaciones?: string;
}

export const generateQuotationPDF = (data: PDFData, action: 'save' | 'view' = 'save') => {
    console.log(`Generating PDF (${action}) with data:`, data);
    try {
        const doc = new jsPDF();

        // Branding Header
        doc.setFillColor(0, 74, 153);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");

        // Logo in Header (White background box)
        try {
            doc.setFillColor(255, 255, 255);
            doc.rect(5, 5, 30, 30, 'F');
            doc.addImage(logoBase64, 'JPEG', 5, 5, 30, 30);
        } catch (e) {
            console.error("Error drawing logo in header", e);
        }

        doc.text("HELP SOLUCIONES INFORMATICAS", 40, 22);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Cotización N°: ${data.consecutivo}`, 200, 27, { align: 'right' });
        doc.text("Expertos en Tecnología | Servicios y Productos", 40, 35);

        // Client Info Box
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("INFORMACIÓN DEL CLIENTE", 14, 50);
        doc.line(14, 52, 100, 52);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Nombre: ${data.cliente.nombre}`, 14, 60);
        doc.text(`NIT: ${data.cliente.nit}`, 14, 65);
        doc.text(`Contacto: ${data.cliente.contacto}`, 14, 70);
        doc.text(`Dirección: ${data.cliente.direccion}`, 14, 75);

        doc.text(`Fecha: ${new Date().toISOString().split('T')[0]}`, 150, 60);
        doc.text(`Validez: ${data.validez || 3} día(s) calendario`, 150, 65);

        // Recalculate totals internally to ensure consistency with displayed items
        let calculatedSubtotal = 0;
        let calculatedIVA = 0;

        const tableBody = data.items.map(item => {
            const prod = data.productos.find(p => p.id === item.productoId);
            // Use high precision for intermediate calculations
            const ventaUnit = item.precioVenta !== undefined ? item.precioVenta : ((item.costoUnitario || 0) / (1 - Math.min(item.utilidad || 0, 99.99) / 100));
            const itemSubtotal = (ventaUnit * item.cantidad);
            const itemIVA = prod?.exentoIva ? 0 : (itemSubtotal * (item.iva || 19) / 100);
            
            calculatedSubtotal += itemSubtotal;
            calculatedIVA += itemIVA;

            return [
                prod?.nombre || 'N/A',
                item.unidad || 'Und',
                item.cantidad,
                `$${ventaUnit.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`,
                `$${itemSubtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`
            ];
        });

        const calculatedTotal = calculatedSubtotal + calculatedIVA;

        autoTable(doc, {
            startY: 85,
            head: [['Descripción del Producto', 'Unidad', 'Cant.', 'Precio Unit.', 'Subtotal']],
            body: tableBody,
            headStyles: { fillColor: [0, 74, 153], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [240, 245, 255] },
            margin: { top: 85 }
        });

        // Safe way to get final Y position from autoTable
        let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 85;

        // Totals
        const totalsX = 135;
        const valuesX = 195;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`SUBTOTAL:`, totalsX, finalY + 15);
        doc.setFont("helvetica", "normal");
        doc.text(`$${calculatedSubtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`, valuesX, finalY + 15, { align: 'right' });

        doc.setFont("helvetica", "bold");
        doc.text(`IVA TOTAL:`, totalsX, finalY + 22);
        doc.setFont("helvetica", "normal");
        doc.text(`$${calculatedIVA.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`, valuesX, finalY + 22, { align: 'right' });

        doc.setFillColor(0, 74, 153);
        doc.rect(totalsX - 5, finalY + 28, 70, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`VALOR TOTAL:`, totalsX, finalY + 36);
        doc.text(`$${calculatedTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`, valuesX, finalY + 36, { align: 'right' });

        let currentY = finalY + 50;

        // Conditions
        if (data.condiciones) {
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            const splitConds = doc.splitTextToSize(data.condiciones, 180);

            // Si el bloque de condiciones es muy largo y no cabe en la página actual, saltar de página antes de imprimir
            if (currentY + 15 + (splitConds.length * 5) > 280) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFont("helvetica", "bold");
            doc.text("CONDICIONES COMERCIALES:", 14, currentY + 5);
            doc.setFont("helvetica", "normal");
            doc.text(splitConds, 14, currentY + 12);
            currentY += 15 + (splitConds.length * 5);
        }

        // Observations
        if (data.observaciones) {
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            const splitObs = doc.splitTextToSize(data.observaciones, 180);

            if (currentY + 15 + (splitObs.length * 5) > 280) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFont("helvetica", "bold");
            doc.text("OBSERVACIONES:", 14, currentY + 5);
            doc.setFont("helvetica", "normal");
            doc.text(splitObs, 14, currentY + 12);
            currentY += 15 + (splitObs.length * 5);
        }

        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }

        // Signature
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("ATENTAMENTE,", 14, currentY + 10);

        const ejecutivoNombre = (data.ejecutivo?.nombre || 'ADMIN').toUpperCase();
        doc.text(ejecutivoNombre, 14, currentY + 30);

        doc.setFont("helvetica", "normal");
        doc.text(data.ejecutivo?.cargo || 'Ejecutivo Comercial', 14, currentY + 35);
        doc.text(`Tel: ${data.ejecutivo?.telefono || ''}`, 14, currentY + 40);
        doc.text(`Email: ${data.ejecutivo?.correo || ''}`, 14, currentY + 45);

        // Company Footer
        const footerY = currentY + 60;
        if (footerY > 270) {
            doc.addPage();
            currentY = 10;
        }
        const fY = footerY > 270 ? 20 : footerY;
        doc.setDrawColor(0, 74, 153);
        doc.setLineWidth(0.5);
        doc.line(14, fY, 196, fY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 74, 153);
        doc.text("HELP SOLUCIONES INFORMATICAS HSI SAS", 105, fY + 5, { align: 'center' });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text("NIT 900686378-7 | Celular: 3043358650 - 3003453610 | gerencia@helpsoluciones.com.co", 105, fY + 10, { align: 'center' });

        const safeClientName = (data.cliente?.nombre || 'CLIENTE').toUpperCase().replace(/[^a-zA-Z0-9]/g, '_');
        const safeConsecutivo = (data.consecutivo || 'SN').replace(/[^a-zA-Z0-9-]/g, '_');
        const fileName = `COTIZACION_HSI_${safeClientName}_${safeConsecutivo}.pdf`;

        if (action === 'view') {
            const blobUrl = doc.output('bloburl');
            window.open(blobUrl, '_blank');
        } else {
            doc.save(fileName);
        }
    } catch (error: any) {
        console.error("Error generating PDF:", error);
        alert(`Error detallado al generar el PDF: ${error.message || 'Error desconocido'}. Por favor reporte este mensaje.`);
    }
};

export interface CommercialReportData {
    periodo: { inicio: string; fin: string };
    data: {
        vendedor: string;
        cargo: string;
        meta: number;
        logrado: number;
        cumplimiento: number;
        envios: number;
        recogidas: number;
        historial: any[];
    }[];
}

export const generateCommercialReportPDF = (report: CommercialReportData) => {
    try {
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(0, 74, 153);
        doc.rect(0, 0, 210, 35, 'F');
        
        try {
            doc.setFillColor(255, 255, 255);
            doc.rect(10, 5, 25, 25, 'F');
            doc.addImage(logoBase64, 'JPEG', 10, 5, 25, 25);
        } catch (e) {}

        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("INFORME DE GESTIÓN COMERCIAL", 40, 18);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Periodo: ${report.periodo.inicio} al ${report.periodo.fin}`, 40, 25);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 200, 25, { align: 'right' });

        let currentY = 45;

        report.data.forEach((item) => {
            // Check for new page
            if (currentY > 240) {
                doc.addPage();
                currentY = 20;
            }

            // Vendedor Title
            doc.setFillColor(240, 245, 255);
            doc.rect(10, currentY, 190, 8, 'F');
            doc.setTextColor(0, 74, 153);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`${item.vendedor.toUpperCase()} - ${item.cargo}`, 14, currentY + 6);
            currentY += 12;

            // Stats row
            autoTable(doc, {
                startY: currentY,
                head: [['Meta Mensual', 'Ventas Logradas', '% Cumpl', 'Envíos', 'Recogidas']],
                body: [[
                    `$${Math.round(item.meta).toLocaleString()}`,
                    `$${Math.round(item.logrado).toLocaleString()}`,
                    `${item.cumplimiento.toFixed(1)}%`,
                    item.envios.toString(),
                    item.recogidas.toString()
                ]],
                headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontSize: 9 },
                bodyStyles: { fontSize: 10, fontStyle: 'bold' },
                theme: 'grid',
                margin: { left: 14, right: 14 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 8;

            // Historial Title Small
            doc.setFontSize(9);
            doc.setTextColor(0,0,0);
            doc.text("Comparativa Mensual (Histórico):", 14, currentY);
            currentY += 2;

            // History Table
            autoTable(doc, {
                startY: currentY,
                head: [['Mes', 'Presupuesto', 'Logrado', 'Cotiz.', '%']],
                body: item.historial.map(h => [
                    h.month,
                    `$${Math.round(h.budget).toLocaleString()}`,
                    `$${Math.round(h.sales).toLocaleString()}`,
                    h.quotes.toString(),
                    `${h.percent.toFixed(1)}%`
                ]),
                headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontSize: 8 },
                bodyStyles: { fontSize: 8 },
                theme: 'striped',
                margin: { left: 20, right: 20 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
        });

        // Final Footer
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Help Soluciones Informáticas HSI SAS - HelpiCRM Business Intelligence", 105, 285, { align: 'center' });

        doc.save(`INFORME_COMERCIAL_${report.periodo.inicio}_${report.periodo.fin}.pdf`);

    } catch (error) {
        console.error("PDF Error:", error);
        alert("Error al generar reporte PDF.");
    }
};
