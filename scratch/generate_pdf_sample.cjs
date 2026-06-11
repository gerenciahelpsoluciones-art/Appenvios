const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;
const fs = require('fs');
const path = require('path');

// Read logo from logo_base64.txt if it exists or use dummy/empty
let logoBase64 = "";
try {
    const logoTxtPath = path.join(__dirname, '..', 'logo_base64.txt');
    if (fs.existsSync(logoTxtPath)) {
        logoBase64 = fs.readFileSync(logoTxtPath, 'utf8').trim();
        if (!logoBase64.startsWith('data:')) {
            logoBase64 = 'data:image/jpeg;base64,' + logoBase64;
        }
    }
} catch (e) {
    console.log("Could not load logo base64, using fallback text:", e.message);
}

// Colors from propuestaPdf.ts
const DARK_BLUE = [15, 32, 39];
const INDIGO = [99, 102, 241];
const WHITE = [255, 255, 255];
const LIGHT_GRAY = [248, 250, 252];
const TEXT_DARK = [30, 41, 59];
const TEXT_MUTED = [100, 116, 139];

// Mock template data corresponding to 'mesa-de-ayuda'
const template = {
    id: 'mesa-de-ayuda',
    nombre: 'Mesa de Ayuda y Soporte Técnico Integrado',
    icono: '🛠️',
    color: '#3b82f6',
    descripcion: 'Servicio integral de Mesa de Ayuda (Help Desk) con soporte remoto 5x8, visitas mensuales presenciales y mantenimiento de hardware y software a nivel nacional.',
    introProtocolo:
      'Garantizamos la continuidad operativa de su plataforma tecnológica mediante soporte técnico presencial y remoto. ' +
      'Nuestra solución integra personal técnico calificado, mantenimientos periódicos y un software de mesa de ayuda digital ' +
      'para asegurar el cumplimiento de acuerdos de niveles de servicio (SLA).',
    pasosInfografia: [
      { icono: '🔍', titulo: 'Monitoreo e Inventario', descripcion: 'Auditoría inicial y control continuo del parque tecnológico bajo cobertura.' },
      { icono: '💻', titulo: 'Soporte Remoto 5x8', descripcion: 'Atención técnica vía chat, teléfono o remota para solución ágil de incidentes.' },
      { icono: '🧹', titulo: 'Mantenimiento Físico', descripcion: '2 ciclos de mantenimiento preventivo de hardware al año.' },
      { icono: '🔒', titulo: 'Portal de Casos', descripcion: 'Registro de solicitudes y trazabilidad en línea (helpsoluciones.com.co/soportetecnico).' },
      { icono: '📋', titulo: 'Informes Mensuales', descripcion: 'Entrega mensual de reportes detallados de actividades y soporte brindado.' },
    ],
    pasosLista: [
      'Mantenimiento preventivo anual para los equipos de la entidad, ejecutado en 2 periodos semestrales.',
      'Soporte remoto y en sitio en Bogotá de Lunes a Viernes de 8:00 AM a 5:00 PM.',
      'Canal continuo de comunicación entre el supervisor de Cinemark y Help Soluciones.',
      'Préstamo de hasta 2 equipos de respaldo en calidad de préstamo por un periodo máximo de 5 días.',
      'Bolsa de repuestos en sitio facturados de forma mensual o inmediata según autorización.',
      'Cumplimiento estricto del Sistema de Gestión de Seguridad y Salud en el Trabajo (SGSST).',
    ]
};

// Mock propuesta data for Cinemark
const propuesta = {
    consecutivo: 'P-0042',
    fecha: '2026-06-11',
    clienteNombre: 'CINEMARK COLOMBIA S.A.S.',
    clienteNit: '830.049.208-1',
    clienteContacto: 'Ing. Diego Gerber',
    clienteCiudad: 'Bogotá / Nacional (21 Sedes)',
    tipoServicioId: 'mesa-de-ayuda',
    tipoServicioNombre: 'Mesa de Ayuda y Soporte Técnico Integrado',
    moneda: 'COP',
    valor: 179294916, // including IVA
    incluyeIva: true,
    vigencia: '30 días',
    observaciones: 'Sujeto a verificación y validación de inventario de equipos bajo cobertura.',
    objetivo: 'El objetivo de la presente propuesta es ofrecer un contrato de mantenimiento preventivo y correctivo de software y hardware para los 1000 equipos del parque tecnológico de CINEMARK, así como la atención presencial mensual, mesa de ayuda digital y soporte remoto 5x8.',
    personal: [
        { id: '1', nombre: 'Carlos Arturo Sáenz Hurtado', cargo: 'Gerente de Proyecto / Supervisor' },
        { id: '2', nombre: 'Técnico Residente Bogotá', cargo: 'Ingeniero de Soporte Nivel 1' },
        { id: '3', nombre: 'Técnico Soporte Nacional', cargo: 'Técnico de Zona (21 Ciudades)' }
    ],
    visitas: [
        { id: '1', sede: 'Bogotá (9 salas)', horario: 'Lunes a Viernes 8:00 AM - 5:00 PM (Soporte Remoto/En Sitio)' },
        { id: '2', sede: 'Nacional (12 ciudades / 12 salas)', horario: 'Una visita mensual programada de 8 horas hábiles por sede' }
    ],
    obligacionesCliente: [
        'Proporcionar acceso a las instalaciones y a los equipos de cómputo y POS.',
        'Notificar las incidencias o fallas de manera oportuna a través del portal de mesa de ayuda.',
        'Designar un supervisor o contacto técnico único para coordinar las agendas de visitas.',
        'Cumplir con los pagos mensuales dentro de los primeros 5 días de cada mes.'
    ],
    items: [
        {
            id: '1',
            descripcion: 'Servicio mensual de Mesa de Ayuda y Mantenimiento Tecnológico (Soporte remoto 5x8, soporte presencial en Bogotá, 2 mantenimientos preventivos anuales para 1000 equipos y visitas de 8 horas en 12 ciudades fuera de Bogotá)',
            numPart: 'HELP-MA-01',
            cantidad: 12,
            valorUnitario: 12557333
        }
    ],
    comercialNombre: 'Carlos Arturo Sáenz Hurtado',
    comercialTelefono: '3043358650',
    estado: 'Borrador'
};

const formatCurrency = (amount, moneda) =>
  moneda === 'COP'
    ? `$${Math.round(amount).toLocaleString('es-CO')}`
    : `USD ${amount.toFixed(2)}`;

const addPageHeader = (doc, pageNum) => {
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, 210, 12, 'F');
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', 5, 1, 10, 10);
    } catch (_) {}
  }
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(`Propuesta ${propuesta.consecutivo} · ${propuesta.clienteNombre}`, 205, 7, { align: 'right' });
  doc.setFontSize(6.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(`Página ${pageNum}`, 105, 7, { align: 'center' });
};

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
const W = 210;

// PAGE 1: COVER
doc.setFillColor(...DARK_BLUE);
doc.rect(0, 0, W, 297, 'F');

doc.setFillColor(...INDIGO);
doc.rect(0, 0, W, 3, 'F');

if (logoBase64) {
  try {
    doc.setFillColor(...WHITE);
    doc.rect(13, 13, 34, 26, 'F');
    doc.addImage(logoBase64, 'JPEG', 15, 14, 30, 24);
  } catch (_) {}
}

doc.setFontSize(8);
doc.setTextColor(200, 210, 230);
doc.setFont('helvetica', 'normal');
doc.text('Tecnologia - Soporte - Mantenimiento', 52, 23);
doc.text('helpsoluciones.com.co', 52, 29);

doc.setDrawColor(...INDIGO);
doc.setLineWidth(0.3);
doc.line(13, 42, W - 14, 42);

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

const clientFields = [
  ['Cliente', propuesta.clienteNombre],
  ['NIT', propuesta.clienteNit || '—'],
  ['Contacto', propuesta.clienteContacto || '—'],
  ['Ciudad', propuesta.clienteCiudad || '—'],
];

const maxColW = (W - 28) / 2 - 12;
const boxStartY = 108;
const rowH = 17;
const boxH = 2 * rowH + 12;

doc.setFillColor(30, 45, 60);
doc.roundedRect(14, boxStartY, W - 28, boxH, 4, 4, 'F');
doc.setDrawColor(80, 100, 130);
doc.setLineWidth(0.3);
doc.roundedRect(14, boxStartY, W - 28, boxH, 4, 4, 'S');

doc.setDrawColor(60, 80, 110);
doc.line(W / 2 + 2, boxStartY + 5, W / 2 + 2, boxStartY + boxH - 5);

clientFields.forEach(([label, val], i) => {
  const col = i % 2 === 0 ? 20 : W / 2 + 8;
  const baseY = boxStartY + 9 + Math.floor(i / 2) * rowH;

  doc.setFontSize(6);
  doc.setTextColor(130, 150, 180);
  doc.setFont('helvetica', 'normal');
  doc.text(label.toUpperCase(), col, baseY);

  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  const lines = doc.splitTextToSize(val, maxColW);
  doc.text(lines[0], col, baseY + 5.5);
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


// PAGE 2: SERVICE DETAILS
doc.addPage();
addPageHeader(doc, 2);

let yD = 22;
doc.setFontSize(7.5);
doc.setTextColor(...INDIGO);
doc.setFont('helvetica', 'bold');
doc.text('DETALLES DE LA PROPUESTA', 14, yD);
yD += 6;

doc.setFontSize(13);
doc.setTextColor(...TEXT_DARK);
doc.setFont('helvetica', 'bold');
doc.text('Alcance y Condiciones del Servicio', 14, yD);
yD += 8;

if (propuesta.objetivo) {
  const objLines = doc.splitTextToSize(propuesta.objetivo, W - 36);
  const objBoxH = 12 + objLines.length * 5;
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(14, yD, W - 28, objBoxH, 'F');
  doc.setFillColor(...INDIGO);
  doc.rect(14, yD, 1.5, objBoxH, 'F');
  doc.setFontSize(6.5);
  doc.setTextColor(130, 150, 180);
  doc.setFont('helvetica', 'bold');
  doc.text('OBJETIVO DE LA PROPUESTA', 18, yD + 5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text(propuesta.objetivo, 18, yD + 11, { maxWidth: W - 36 });
  yD += objBoxH + 7;
}

const personalData = propuesta.personal.filter(p => p.nombre);
if (personalData.length > 0) {
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Personal a Cargo', 14, yD);
  yD += 3;
  autoTable(doc, {
    startY: yD,
    margin: { left: 14, right: 14 },
    head: [['Nombre', 'Cargo / Rol']],
    body: personalData.map(p => [p.nombre, p.cargo]),
    headStyles: { fillColor: DARK_BLUE, textColor: WHITE, fontSize: 8 },
    bodyStyles: { fontSize: 8.5 },
  });
  yD = doc.lastAutoTable.finalY + 7;
}

const visitasData = propuesta.visitas.filter(v => v.sede);
if (visitasData.length > 0) {
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Visitas a Sedes y Horarios', 14, yD);
  yD += 3;
  autoTable(doc, {
    startY: yD,
    margin: { left: 14, right: 14 },
    head: [['Sede / Ciudad', 'Ventana de Mantenimiento']],
    body: visitasData.map(v => [v.sede, v.horario]),
    headStyles: { fillColor: DARK_BLUE, textColor: WHITE, fontSize: 8 },
    bodyStyles: { fontSize: 8.5 },
  });
  yD = doc.lastAutoTable.finalY + 3;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('* El mantenimiento se realizará en la ventana de mantenimiento propuesta por el cliente.', 14, yD);
  yD += 7;
}

const obligaciones = propuesta.obligacionesCliente.filter(o => o.trim());
if (obligaciones.length > 0) {
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Obligaciones del Cliente', 14, yD);
  yD += 5;
  obligaciones.forEach(oblig => {
    doc.setFillColor(...INDIGO);
    doc.circle(17.5, yD - 1, 1.5, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);
    const lines = doc.splitTextToSize(oblig, W - 34);
    doc.text(lines, 22, yD);
    yD += lines.length * 5 + 2;
  });
}


// PAGE 3: PROTOCOL
doc.addPage();
addPageHeader(doc, 3);

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

const cardW = (W - 28 - 8) / 3;
const cardH = 38;
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
  doc.circle(x + cardW / 2, cy + 6, 4.5, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text(String(idx + 1), x + cardW / 2, cy + 8, { align: 'center' });

  // No canvas/emojis on Node side - write text representation
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(paso.titulo, x + cardW / 2, cy + 24, { align: 'center' });

  doc.setFontSize(6.2);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(paso.descripcion, cardW - 4);
  doc.text(descLines, x + cardW / 2, cy + 29, { align: 'center' });
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
  const txt = paso.replace(/de Cinemark/gi, `de ${propuesta.clienteNombre}`).replace(/del cliente/gi, `de ${propuesta.clienteNombre}`).replace(/el cliente/gi, propuesta.clienteNombre);
  doc.text(txt, 26, y + 5.2);
  y += 10;
});


// PAGE 4: SLA PAGE (MESA DE AYUDA ONLY)
let pageNum = 4;
if (propuesta.tipoServicioId === 'mesa-de-ayuda') {
  doc.addPage();
  addPageHeader(doc, pageNum);
  pageNum++;

  let ySla = 22;
  doc.setFontSize(7.5);
  doc.setTextColor(...INDIGO);
  doc.setFont('helvetica', 'bold');
  doc.text('ACUERDOS DE SERVICIO', 14, ySla);
  ySla += 6;

  doc.setFontSize(14);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Acuerdos de Niveles de Servicio (SLA) - Nivel 1', 14, ySla);
  ySla += 8;

  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(14, ySla, W - 28, 14, 'F');
  doc.setFillColor(...INDIGO);
  doc.rect(14, ySla, 1.5, 14, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'normal');
  const slaIntro = 'Los compromisos descritos a continuación aplican exclusivamente para la atención primaria de incidentes y requerimientos de soporte técnico (Nivel 1) sobre los equipos de cómputo de los usuarios finales.';
  const slaIntroLines = doc.splitTextToSize(slaIntro, W - 34);
  doc.text(slaIntroLines, 18, ySla + 5.5);
  ySla += 20;

  autoTable(doc, {
    startY: ySla,
    margin: { left: 14, right: 14 },
    head: [['Criticidad', 'Descripción / Tipo de Incidente (Nivel 1)', 'T. Respuesta', 'T. Solución', 'Canal']],
    body: [
      ['Crítica', 'Equipo no enciende o pantalla azul (bloqueo total de labores)', '<= 15 min', '<= 2 horas', 'Remoto / Sitio'],
      ['Alta', 'Cuentas bloqueadas, sin internet o falla en app principal del usuario', '<= 30 min', '<= 4 horas', 'Remoto / Sitio'],
      ['Media', 'Lentitud del equipo, impresoras, software secundario o periféricos', '<= 1 hora', '<= 12 horas', 'Remoto'],
      ['Baja', 'Dudas de software, consultas generales o cambios estéticos', '<= 2 horas', '<= 48 horas', 'Portal / Remoto']
    ],
    headStyles: { fillColor: DARK_BLUE, textColor: WHITE, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center' }
    }
  });

  ySla = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Notas de los Acuerdos (ANS):', 14, ySla);
  ySla += 5;

  const slaNotes = [
    '• Horario de Cobertura: El cumplimiento de los ANS se calcula dentro del horario de atención hábil (Lunes a Viernes de 8:00 AM a 5:00 PM).',
    '• Inicio del Tiempo: Los tiempos corren desde el registro formal del ticket en el portal de Mesa de Ayuda.',
    '• Excepcionalidad: No cubre soporte de infraestructura física de red corporativa, servidores, bases de datos o servicios de Nivel 2 y 3.'
  ];

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  slaNotes.forEach(note => {
    const noteLines = doc.splitTextToSize(note, W - 28);
    doc.text(noteLines, 14, ySla);
    ySla += noteLines.length * 4 + 1;
  });
}

// PAGE 5: INVERSION
doc.addPage();
addPageHeader(doc, pageNum);

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

const itemsConValor = propuesta.items;
const subtotal = itemsConValor.reduce((s, it) => s + it.cantidad * it.valorUnitario, 0);
const iva = propuesta.incluyeIva ? Math.round(subtotal * 0.19) : 0;
const total = subtotal + iva;

const tableBody = itemsConValor.map(it => [
  { content: it.descripcion + (it.numPart ? `\nRef: ${it.numPart}` : ''), styles: { fontSize: 8.5 } },
  String(it.cantidad),
  formatCurrency(it.valorUnitario, propuesta.moneda),
  formatCurrency(it.cantidad * it.valorUnitario, propuesta.moneda),
]);

if (itemsConValor.length > 1 || propuesta.incluyeIva) {
  tableBody.push([
    { content: 'Subtotal', colSpan: 3, styles: { textColor: [100, 116, 139] } },
    formatCurrency(subtotal, propuesta.moneda),
  ]);
}
if (propuesta.incluyeIva) {
  tableBody.push([
    { content: 'IVA (19%)', colSpan: 3, styles: { textColor: [100, 116, 139] } },
    formatCurrency(iva, propuesta.moneda)
  ]);
}
tableBody.push([
  { content: 'TOTAL A PAGAR', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
  { content: formatCurrency(total, propuesta.moneda), styles: { fontStyle: 'bold', textColor: [67, 56, 202], fillColor: [241, 245, 249] } },
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

y = doc.lastAutoTable.finalY + 8;

if (propuesta.observaciones) {
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'italic');
  const obsLines = doc.splitTextToSize(`Nota: ${propuesta.observaciones}`, W - 28);
  doc.text(obsLines, 14, y);
  y += obsLines.length * 5 + 4;
}

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
  '• Forma de pago: Se factura 5 días de cada mes después de cumplir con el servicio.',
  '• El servicio se presta a nivel nacional en las ciudades detalladas en el anexo técnico.',
  '• No incluye partes, repuestos o consumibles que no estén expresamente cotizados.',
];
doc.setFontSize(7.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(...TEXT_MUTED);
terms.forEach((term, i) => {
  doc.text(term, 18, y + 13 + i * 4.5);
});

y += 38;

const sigW = (W - 28 - 10) / 3;
const initials = "CA";

const sigDefs = [
  { title: 'Help Soluciones\nInformáticas', subtitle: 'Representante Legal', avatarColor: DARK_BLUE, avatarText: 'H' },
  { title: propuesta.comercialNombre, subtitle: `Asesor de la Propuesta\n${propuesta.comercialTelefono}`, avatarColor: INDIGO, avatarText: initials },
  { title: propuesta.clienteNombre, subtitle: 'Cliente — Aceptación', avatarColor: [226, 232, 240], avatarText: 'C' },
];

sigDefs.forEach((sig, i) => {
  const sx = 14 + i * (sigW + 5);

  doc.setFillColor(...sig.avatarColor);
  doc.circle(sx + sigW / 2, y + 8, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...(sig.avatarColor[0] === 226 ? [100, 116, 139] : WHITE));
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

// Save to disk using Node FS
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
const outputPdfPath = path.join(__dirname, 'propuesta_sample.pdf');
fs.writeFileSync(outputPdfPath, pdfBuffer);
console.log("PDF sample generated successfully at:", outputPdfPath);
