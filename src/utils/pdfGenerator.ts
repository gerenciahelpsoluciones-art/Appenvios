import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../assets/logoBase64';
import type { Cliente, Producto } from '../App';

export interface PDFData {
    consecutivo: string;
    cliente: Cliente;
    items: any[];
    productos: Producto[];
    subtotal: number;
    iva: number;
    total: number;
    condiciones: string;
    ejecutivo: {
        nombre: string;
        cargo: string;
        telefono: string;
        correo: string;
    };
}

export const generateQuotationPDF = (data: PDFData) => {
    console.log("Generating PDF with data:", data);
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
        doc.text(`Validez: 15 días calendario`, 150, 65);

        // Table Data
        const tableBody = data.items.map(item => {
            const prod = data.productos.find(p => p.id === item.productoId);
            const ventaUnit = item.costoUnitario * (1 + item.utilidad / 100);
            const subtotal = ventaUnit * item.cantidad;
            return [
                prod?.nombre || 'N/A',
                prod?.numPart || 'N/A',
                item.unidad || 'Und',
                item.cantidad,
                `$${ventaUnit.toLocaleString()}`,
                `$${subtotal.toLocaleString()}`
            ];
        });

        autoTable(doc, {
            startY: 85,
            head: [['Descripción del Producto', 'N° Parte', 'Unidad', 'Cant.', 'Precio Unit.', 'Subtotal']],
            body: tableBody,
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
            finalY = 85 + (tableBody.length * 10) + 15;
        }

        // Totals
        const totalsX = 135;
        const valuesX = 195;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`SUBTOTAL:`, totalsX, finalY + 15);
        doc.setFont("helvetica", "normal");
        doc.text(`$${(data.subtotal || 0).toLocaleString()}`, valuesX, finalY + 15, { align: 'right' });

        doc.setFont("helvetica", "bold");
        doc.text(`IVA TOTAL:`, totalsX, finalY + 22);
        doc.setFont("helvetica", "normal");
        doc.text(`$${(data.iva || 0).toLocaleString()}`, valuesX, finalY + 22, { align: 'right' });

        doc.setFillColor(0, 74, 153);
        doc.rect(totalsX - 5, finalY + 28, 70, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`VALOR TOTAL:`, totalsX, finalY + 36);
        doc.text(`$${(data.total || 0).toLocaleString()}`, valuesX, finalY + 36, { align: 'right' });

        let currentY = finalY + 45;

        // Conditions
        if (data.condiciones) {
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("CONDICIONES COMERCIALES:", 14, currentY + 5);
            doc.setFont("helvetica", "normal");
            const splitConds = doc.splitTextToSize(data.condiciones, 180);
            doc.text(splitConds, 14, currentY + 12);
            currentY += 12 + (splitConds.length * 5);
        }

        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }

        // Signature
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("ATENTAMENTE,", 14, currentY + 10);
        doc.text((data.ejecutivo.nombre || 'ADMIN').toUpperCase(), 14, currentY + 30);
        doc.setFont("helvetica", "normal");
        doc.text(data.ejecutivo.cargo || 'Ejecutivo Comercial', 14, currentY + 35);
        doc.text(`Tel: ${data.ejecutivo.telefono || ''}`, 14, currentY + 40);
        doc.text(`Email: ${data.ejecutivo.correo || ''}`, 14, currentY + 45);

        const fileName = `COTIZACION HELP SOLUCIONES - ${(data.cliente.nombre || 'CLIENTE').toUpperCase()} - ${data.consecutivo}.pdf`;
        doc.save(fileName);
    } catch (error: any) {
        console.error("Error generating PDF:", error);
        alert(`Error al generar el PDF: ${error.message || 'Error desconocido'}. Verifique los datos.`);
    }
};
