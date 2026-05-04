import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Quote, QuoteDetail } from '../types/quote.types';

export const generateQuotePDF = (quote: Quote, details: QuoteDetail[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Header ---
  doc.setFillColor(30, 41, 59); // Sleek Dark Slate hsl(215, 32%, 17%)
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Company Info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('HELP SOLUCIONES', 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Ingeniería y Soporte TI de Alto Impacto', 14, 35);
  doc.text('www.helpsoluciones.com.co', 14, 40);

  // Quote Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('PROPUESTA COMERCIAL', pageWidth - 14, 20, { align: 'right' });
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${quote.numero}`, pageWidth - 14, 32, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`Válida por ${quote.validez_oferta} días`, pageWidth - 14, 40, { align: 'right' });

  // --- Client Info Section ---
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DIRIGIDO A:', 14, 65);
  
  doc.setFont('helvetica', 'normal');
  const clientName = quote.comprador_nombre || quote.cliente?.nombre || 'Cliente General';
  doc.text(clientName, 14, 72);
  if (quote.comprador_email) doc.text(quote.comprador_email, 14, 78);
  if (quote.comprador_telefono) doc.text(`Tel: ${quote.comprador_telefono}`, 14, 84);

  // Date Column
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA DE EMISIÓN:', pageWidth - 80, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(quote.fecha).toLocaleDateString(), pageWidth - 14, 65, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('REFERENCIA:', pageWidth - 80, 72);
  doc.setFont('helvetica', 'normal');
  doc.text('Cotización de Servicios/Productos', pageWidth - 14, 72, { align: 'right' });

  // --- Table ---
  const tableData = details.map((d, index) => [
    index + 1,
    d.descripcion,
    d.cantidad.toString(),
    `$${d.precio_unitario.toLocaleString()}`,
    `$${d.subtotal.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 95,
    head: [['#', 'Descripción del Item', 'Cant.', 'V. Unitario', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 40 },
      4: { halign: 'right', cellWidth: 40 }
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    }
  });

  // --- Totals ---
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // Summary Box
  doc.setFillColor(248, 250, 252);
  doc.rect(pageWidth - 90, finalY - 5, 76, 25, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR TOTAL:', pageWidth - 85, finalY + 10);
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(`$${quote.total.toLocaleString()} COP`, pageWidth - 19, finalY + 10, { align: 'right' });

  // --- Terms & Footer ---
  if (quote.observaciones) {
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas y Condiciones:', 14, finalY + 40);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(quote.observaciones, 180);
    doc.text(splitText, 14, finalY + 47);
  }

  // Final Call to Action
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const footerY = 275;
  doc.text('Para aceptar esta propuesta, por favor responda a este documento o contáctenos directamente.', pageWidth / 2, footerY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Gracias por confiar en Help Soluciones.', pageWidth / 2, footerY + 7, { align: 'center' });

  // Save
  doc.save(`Cotizacion_${quote.numero}.pdf`);
};
