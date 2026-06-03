// src/services/propuestaPdf.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../assets/logoBase64';
import type { Propuesta } from '../App';
import { SERVICIO_TEMPLATES } from '../data/servicioTemplates';

const DARK_BLUE: [number, number, number] = [15, 32, 39];
const INDIGO: [number, number, number] = [99, 102, 241];
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_GRAY: [number, number, number] = [248, 250, 252];
const TEXT_DARK: [number, number, number] = [30, 41, 59];
const TEXT_MUTED: [number, number, number] = [100, 116, 139];

const formatCurrency = (amount: number, moneda: 'COP' | 'USD') =>
  moneda === 'COP'
    ? `$${Math.round(amount).toLocaleString('es-CO')}`
    : `USD ${amount.toFixed(2)}`;

const addPageHeader = (doc: jsPDF, propuesta: Propuesta, pageNum: number) => {
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, 210, 12, 'F');
  try {
    doc.addImage(logoBase64, 'JPEG', 5, 1, 10, 10);
  } catch (_) { /* logo fallback */ }
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(`Propuesta ${propuesta.consecutivo} · ${propuesta.clienteNombre}`, 205, 7, { align: 'right' });
  doc.setFontSize(6.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Página ${pageNum}`, 105, 7, { align: 'center' });
};

export const generatePropuestaPDF = (propuesta: Propuesta, action: 'save' | 'view' = 'save') => {
  const template = SERVICIO_TEMPLATES.find(t => t.id === propuesta.tipoServicioId);
  if (!template) throw new Error(`Template not found: ${propuesta.tipoServicioId}`);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;

  // ─── PAGE 1: COVER ──────────────────────────────────────────────────────────

  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, W, 297, 'F');

  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, W, 3, 'F');

  try {
    // White background box with 2mm padding around the logo
    doc.setFillColor(...WHITE);
    doc.rect(13, 13, 34, 26, 'F');
    // Logo image with padding inside the box
    doc.addImage(logoBase64, 'JPEG', 15, 14, 30, 24);
  } catch (_) {
    doc.setFontSize(14);
    doc.setTextColor(...INDIGO);
    doc.setFont('helvetica', 'bold');
    doc.text('HELP SOLUCIONES', 14, 28);
  }

  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.setFont('helvetica', 'normal');
  doc.text('Tecnologia - Soporte - Mantenimiento', 52, 23);
  doc.text('helpsoluciones.com.co', 52, 29);

  doc.setDrawColor(...INDIGO);
  doc.setLineWidth(0.3);
  doc.line(13, 42, W - 14, 42);

  // Badge background (semi-transparent approximation using light indigo)
  doc.setFillColor(40, 45, 100);
  doc.roundedRect(14, 48, 68, 8, 4, 4, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(165, 180, 252);
  doc.setFont('helvetica', 'bold');
  doc.text('MANTENIMIENTO PREVENTIVO', 48, 53.2, { align: 'center' });

  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('Propuesta Comercial', 14, 72);
  doc.text('de Servicios', 14, 84);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 195, 215);
  doc.text(template.nombre, 14, 94);

  // Client info box
  doc.setFillColor(30, 45, 60);
  doc.roundedRect(14, 110, W - 28, 52, 4, 4, 'F');
  doc.setDrawColor(80, 100, 130);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 110, W - 28, 52, 4, 4, 'S');

  const clientFields = [
    ['Cliente', propuesta.clienteNombre],
    ['NIT', propuesta.clienteNit || '—'],
    ['Contacto', propuesta.clienteContacto || '—'],
    ['Ciudad', propuesta.clienteCiudad || '—'],
  ];

  clientFields.forEach(([label, val], i) => {
    const col = i % 2 === 0 ? 20 : 115;
    const row = 122 + Math.floor(i / 2) * 16;
    doc.setFontSize(6.5);
    doc.setTextColor(130, 150, 180);
    doc.text(label.toUpperCase(), col, row);
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(val, col, row + 6);
    doc.setFont('helvetica', 'normal');
  });

  doc.setFontSize(7);
  doc.setTextColor(100, 120, 150);
  const footerY = 275;
  doc.setDrawColor(80, 100, 130);
  doc.setLineWidth(0.2);
  doc.line(14, footerY - 4, W - 14, footerY - 4);
  doc.text(`Ref: ${propuesta.consecutivo}  ·  Fecha: ${propuesta.fecha}`, 14, footerY);
  doc.text(`Vigencia: ${propuesta.vigencia}`, 105, footerY, { align: 'center' });
  doc.text('helpsoluciones.com.co', W - 14, footerY, { align: 'right' });

  // ─── PAGE 2: PROTOCOL ───────────────────────────────────────────────────────

  doc.addPage();
  addPageHeader(doc, propuesta, 2);

  let y = 22;

  doc.setFontSize(7.5);
  doc.setTextColor(...INDIGO);
  doc.setFont('helvetica', 'bold');
  doc.text('ALCANCE DEL SERVICIO', 14, y);
  y += 6;

  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Protocolo de ' + template.nombre, 14, y);
  y += 8;

  // Intro box
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(14, y, W - 28, 18, 'F');
  doc.setFillColor(...INDIGO);
  doc.rect(14, y, 1.5, 18, 'F');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  const introLines = doc.splitTextToSize(template.introProtocolo, W - 34);
  doc.text(introLines, 18, y + 6);
  y += 24;

  // Infographic grid: 3 columns × 2 rows
  const cardW = (W - 28 - 8) / 3;
  const cardH = 32;
  template.pasosInfografia.forEach((paso, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 14 + col * (cardW + 4);
    const cy = y + row * (cardH + 3);

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cy, cardW, cardH, 2, 2, 'FD');

    doc.setFillColor(...INDIGO);
    doc.circle(x + cardW / 2, cy + 8, 5, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(String(idx + 1), x + cardW / 2, cy + 10.5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(paso.titulo, x + cardW / 2, cy + 19, { align: 'center' });

    doc.setFontSize(6.2);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(paso.descripcion, cardW - 4);
    doc.text(descLines, x + cardW / 2, cy + 24, { align: 'center' });
  });

  y += 2 * (cardH + 3) + 4;

  template.pasosLista.forEach((paso, idx) => {
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(14, y, W - 28, 8, 'F');
    doc.setFillColor(...INDIGO);
    doc.circle(20, y + 4, 3, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(String(template.pasosInfografia.length + idx + 1), 20, y + 5.5, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.text(paso, 26, y + 5.2);
    y += 10;
  });

  // ─── PAGE 3: PRICE + TERMS + SIGNATURES ─────────────────────────────────────

  doc.addPage();
  addPageHeader(doc, propuesta, 3);

  y = 22;

  doc.setFontSize(7.5);
  doc.setTextColor(...INDIGO);
  doc.setFont('helvetica', 'bold');
  doc.text('INVERSIÓN', 14, y);
  y += 6;

  doc.setFontSize(13);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Tabla de Inversión', 14, y);
  y += 6;

  const iva = propuesta.incluyeIva ? Math.round(propuesta.valor * 0.19) : 0;
  const total = propuesta.valor + iva;

  const tableBody: (string | { content: string; colSpan?: number; styles?: object })[][] = [
    [
      { content: `${template.nombre}\nIncluye visita técnica, informe y protocolo completo`, styles: { fontSize: 8.5 } },
      '1',
      formatCurrency(propuesta.valor, propuesta.moneda),
      formatCurrency(propuesta.valor, propuesta.moneda),
    ],
  ];
  if (propuesta.incluyeIva) {
    tableBody.push(['IVA (19%)', '', '', formatCurrency(iva, propuesta.moneda)]);
  }
  tableBody.push([
    { content: 'TOTAL A PAGAR', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as [number, number, number] } },
    { content: formatCurrency(total, propuesta.moneda), styles: { fontStyle: 'bold', textColor: [67, 56, 202] as [number, number, number], fillColor: [241, 245, 249] as [number, number, number] } },
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Descripción', 'Cant.', 'V. Unitario', 'Total']],
    body: tableBody,
    headStyles: { fillColor: DARK_BLUE, textColor: WHITE, fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  if (propuesta.observaciones) {
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont('helvetica', 'italic');
    const obsLines = doc.splitTextToSize(`Nota: ${propuesta.observaciones}`, W - 28);
    doc.text(obsLines, 14, y);
    y += obsLines.length * 5 + 4;
  }

  // Terms box
  doc.setFillColor(...LIGHT_GRAY);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, W - 28, 30, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Términos y Condiciones', 18, y + 7);

  const terms = [
    `• Vigencia de la propuesta: ${propuesta.vigencia} a partir de la fecha de emisión.`,
    '• Forma de pago: 50% anticipado, 50% contra entrega del informe técnico.',
    '• El servicio se presta en las instalaciones del cliente en horario hábil.',
    '• No incluye reemplazo de partes o repuestos.',
  ];
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  terms.forEach((term, i) => {
    doc.text(term, 18, y + 13 + i * 4.5);
  });

  y += 38;

  // 3-column signatures
  const sigW = (W - 28 - 10) / 3;
  const initials = (propuesta.comercialNombre || 'EC')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sigDefs = [
    { title: 'Help Soluciones\nInformáticas', subtitle: 'Representante Legal', avatarColor: DARK_BLUE as [number, number, number], avatarText: 'H' },
    { title: propuesta.comercialNombre || 'Ejecutivo Comercial', subtitle: `Asesor de la Propuesta\n${propuesta.comercialTelefono || ''}`, avatarColor: INDIGO as [number, number, number], avatarText: initials },
    { title: propuesta.clienteNombre, subtitle: 'Cliente — Aceptación', avatarColor: [226, 232, 240] as [number, number, number], avatarText: (propuesta.clienteNombre[0] || 'C').toUpperCase() },
  ];

  sigDefs.forEach((sig, i) => {
    const sx = 14 + i * (sigW + 5);

    doc.setFillColor(...sig.avatarColor);
    doc.circle(sx + sigW / 2, y + 8, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.text(sig.avatarText, sx + sigW / 2, y + 11, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    const nameLines = doc.splitTextToSize(sig.title, sigW - 4);
    doc.text(nameLines, sx + sigW / 2, y + 22, { align: 'center' });

    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont('helvetica', 'normal');
    const subLines = doc.splitTextToSize(sig.subtitle, sigW - 4);
    doc.text(subLines, sx + sigW / 2, y + 27 + nameLines.length * 3, { align: 'center' });

    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(sx + 4, y + 50, sx + sigW - 4, y + 50);
  });

  // ─── OUTPUT ─────────────────────────────────────────────────────────────────

  const filename = `Propuesta-${propuesta.consecutivo}-${propuesta.clienteNombre.replace(/\s+/g, '_')}.pdf`;
  if (action === 'view') {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } else {
    doc.save(filename);
  }
};
