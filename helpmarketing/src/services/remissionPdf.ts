import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Remission, RemissionDetail } from '../types/remission.types';

export const generateRemissionPDF = (remission: Remission, details: RemissionDetail[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Header ---
  // Background for Header
  doc.setFillColor(13, 148, 136); // Tealog/Primary color hsl(171, 84%, 29%) -> approx
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Company Info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('HELP SOLUCIONES', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Soluciones Informáticas de Alto Impacto', 14, 28);
  doc.text('Bogotá, Colombia | NIT: 900.XXX.XXX-X', 14, 33);

  // Remission Info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REMISIÓN', pageWidth - 14, 20, { align: 'right' });
  doc.setFontSize(16);
  doc.text(`#${remission.numero}`, pageWidth - 14, 30, { align: 'right' });

  // --- Client & Dates Bar ---
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(remission.cliente?.nombre || 'Cliente General', 40, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('ID/NIT:', 14, 61);
  doc.setFont('helvetica', 'normal');
  doc.text(remission.cliente?.identificacion || 'N/A', 40, 61);

  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', pageWidth - 60, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(remission.fecha).toLocaleDateString(), pageWidth - 14, 55, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO:', pageWidth - 60, 61);
  doc.setFont('helvetica', 'normal');
  doc.text(remission.estado.toUpperCase(), pageWidth - 14, 61, { align: 'right' });

  // --- Table ---
  const tableData = details.map((d, index) => [
    index + 1,
    d.descripcion,
    d.cantidad.toString(),
    `$${d.precio_unitario.toLocaleString()}`,
    `$${d.subtotal.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['#', 'Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 148, 136],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 35 }
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    }
  });

  // --- Totals & Observations ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  if (remission.observaciones) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(remission.observaciones, 100);
    doc.text(splitText, 14, finalY + 5);
  }

  // Total Box
  doc.setFillColor(245, 245, 245);
  doc.rect(pageWidth - 85, finalY - 5, 71, 20, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(pageWidth - 85, finalY - 5, 71, 20, 'S');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 80, finalY + 7);
  doc.setFontSize(14);
  doc.setTextColor(13, 148, 136);
  doc.text(`$${remission.total.toLocaleString()}`, pageWidth - 19, finalY + 7, { align: 'right' });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('Este documento es una remisión de entrega y no constituye una factura de venta legal.', pageWidth / 2, 285, { align: 'center' });
  doc.text('Generado automáticamente por HelpMarketer CRM Engine.', pageWidth / 2, 290, { align: 'center' });

  // Save
  doc.save(`Remision_${remission.numero}.pdf`);
};
