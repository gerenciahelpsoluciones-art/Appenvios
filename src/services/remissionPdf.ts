import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { logoBase64 } from '../assets/logoBase64';

export interface RemissionPDFData {
    numero: string;
    fecha: string;
    cliente: {
        nombre: string;
        nit: string;
        direccion: string;
        telefono: string;
        correo: string;
    };
    items: {
        descripcion: string;
        cantidad: number;
        precio_unitario: number;
        subtotal: number;
    }[];
    total: number;
    observaciones?: string;
}

export const generateRemissionPDF = (data: RemissionPDFData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header & Logo
    try {
        doc.addImage(logoBase64, 'PNG', 15, 15, 45, 15);
    } catch (e) {
        console.error('Error adding logo to PDF', e);
    }

    doc.setFontSize(18);
    doc.setTextColor(0, 74, 153); // Corporate Blue (#004a99)
    doc.text('REMISION DE ENTREGA', pageWidth - 15, 20, { align: 'right' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`N°: ${data.numero}`, pageWidth - 15, 28, { align: 'right' });
    doc.text(`Fecha: ${new Date(data.fecha).toLocaleDateString()}`, pageWidth - 15, 34, { align: 'right' });

    // 2. Company Info (Static)
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text('HELP SOLUCIONES INFORMATICAS HSI SAS', 15, 35);
    doc.text('NIT: 900686378-7', 15, 39);
    doc.text('Celular: 3043358650 - 3003453610 | gerencia@helpsoluciones.com.co', 15, 43);

    // 3. Client Info
    doc.setDrawColor(200);
    doc.line(15, 48, pageWidth - 15, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE:', 15, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${data.cliente.nombre}`, 15, 62);
    doc.text(`NIT: ${data.cliente.nit || 'N/A'}`, 15, 67);
    doc.text(`Dirección: ${data.cliente.direccion || 'N/A'}`, 15, 72);
    doc.text(`Teléfono: ${data.cliente.telefono || 'N/A'}`, 100, 62);
    doc.text(`Email: ${data.cliente.correo || 'N/A'}`, 100, 67);

    // 4. Items Table
    (doc as any).autoTable({
        startY: 80,
        head: [['Descripción', 'Cantidad', 'V. Unitario', 'Subtotal']],
        body: data.items.map(item => [
            item.descripcion,
            item.cantidad,
            `$${item.precio_unitario.toLocaleString()}`,
            `$${item.subtotal.toLocaleString()}`
        ]),
        headStyles: { fillColor: [0, 74, 153], textColor: 255 }, // Corporate Blue
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // 5. Totals & Notes
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: $${data.total.toLocaleString()}`, pageWidth - 15, finalY, { align: 'right' });

    if (data.observaciones) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text('Observaciones:', 15, finalY + 10);
        const splitObs = doc.splitTextToSize(data.observaciones, pageWidth - 30);
        doc.text(splitObs, 15, finalY + 15);
    }

    // 6. Signatures
    const sigY = 250;
    doc.setDrawColor(150);
    doc.line(15, sigY, 80, sigY);
    doc.line(pageWidth - 80, sigY, pageWidth - 15, sigY);
    
    doc.setFontSize(8);
    doc.text('Entregado por (Firma / Sello)', 15, sigY + 5);
    doc.text('Recibido por (Firma / Sello)', pageWidth - 15, sigY + 5, { align: 'right' });

    // 7. Footer
    doc.setFontSize(7);
    doc.setTextColor(150);
    const footerText = 'Este documento es una remisión informativa y no constituye una factura de venta.';
    doc.text(footerText, pageWidth / 2, 285, { align: 'center' });

    doc.save(`Remision_${data.numero}.pdf`);
};
