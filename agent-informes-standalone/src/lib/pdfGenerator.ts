import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportData {
    clienteNombre: string;
    contratoNombre: string;
    mes: string;
    actividades: any[];
    sintesis: string;
    referencias?: string[];
}

export const generateReportPDF = (data: ReportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background
    doc.setFillColor(10, 12, 16);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Branded Header
    doc.setTextColor(255, 61, 0);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("HELP SOLUCIONES INGENIERÍA", 14, 25);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("AGENTE DE INFORMES DE EJECUCIÓN", 14, 32);

    // Metadata Section
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.text("INFORME DE GESTIÓN MENSUAL", 14, 50);

    doc.setFontSize(10);
    doc.text(`Cliente: ${data.clienteNombre}`, 14, 60);
    doc.text(`Contrato: ${data.contratoNombre}`, 14, 67);
    doc.text(`Periodo: ${data.mes}`, 14, 74);
    doc.text(`Evidencias: ${data.actividades.length} actividades / ${data.referencias?.length || 0} ref. técnicas`, 14, 81);

    // Table of Activities
    const tableRows = data.actividades.map(act => [
        act.obligation || act.obligacion,
        act.description || act.actividad,
        act.status || act.estado
    ]);

    (doc as any).autoTable({
        startY: 85,
        head: [['Obligación', 'Actividad Ejecutada', 'Estado']],
        body: tableRows,
        headStyles: { fillColor: [255, 61, 0], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 5 }
    });

    // Synthesis Section
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SÍNTESIS DE VALOR Y LOGROS", 14, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(data.sintesis, pageWidth - 28);
    doc.text(splitText, 14, finalY + 10);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Este informe ha sido generado automáticamente por el Agente de Inteligencia de Help Soluciones.", 14, doc.internal.pageSize.getHeight() - 10);

    doc.save(`${data.clienteNombre}_Informe_${data.mes.replace(/\s+/g, '_')}.pdf`);
};
