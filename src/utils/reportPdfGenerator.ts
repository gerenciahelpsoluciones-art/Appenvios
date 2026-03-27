import { jsPDF } from 'jspdf';
import { logoBase64 } from '../assets/logoBase64';

export interface ReportData {
    clienteNombre: string;
    contratoNombre: string;
    mes: string;
    actividades: {
        obligacion: string;
        actividad: string;
        estado: string;
    }[];
    sintesis: string;
}

export const generateReportPDF = (data: ReportData) => {
    try {
        const doc = new jsPDF();
        
        // Header Background
        doc.setFillColor(0, 74, 153);
        doc.rect(0, 0, 210, 40, 'F');

        // Logo
        try {
            doc.setFillColor(255, 255, 255);
            doc.rect(10, 5, 30, 30, 'F');
            doc.addImage(logoBase64, 'JPEG', 10, 5, 30, 30);
        } catch (e) {
            console.error("Error adding logo", e);
        }

        // Title
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("INFORME DE EJECUCIÓN", 45, 22);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Help Soluciones Informáticas | Agente IA", 45, 30);

        // Body Content
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Cliente: ${data.clienteNombre}`, 14, 55);
        doc.text(`Contrato: ${data.contratoNombre}`, 14, 62);
        doc.text(`Periodo: ${data.mes}`, 14, 69);

        doc.setDrawColor(226, 232, 240);
        doc.line(14, 75, 196, 75);

        // Activities Section
        doc.setFontSize(12);
        doc.text("RESUMEN DE ACTIVIDADES Y CUMPLIMIENTO", 14, 85);
        
        let currentY = 95;
        data.actividades.forEach((act, index) => {
            if (currentY > 260) {
                doc.addPage();
                currentY = 20;
            }
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`${index + 1}. ${act.obligacion}`, 14, currentY);
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            const splitText = doc.splitTextToSize(`Actividad: ${act.actividad}`, 170);
            doc.text(splitText, 14, currentY + 5);
            
            // Status Tag
            const statusColor = act.estado === 'Cumplido' ? [34, 197, 94] : [59, 130, 246];
            doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
            doc.setFont("helvetica", "bold");
            doc.text(`Estado: ${act.estado}`, 14, currentY + 5 + (splitText.length * 5));
            
            doc.setTextColor(30, 41, 59);
            currentY += 15 + (splitText.length * 5);
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Generado automáticamente por HelpiCRM Agente de Informes - Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        }

        doc.save(`Informe_${data.clienteNombre.replace(/\s+/g, '_')}_${data.mes}.pdf`);
    } catch (error) {
        console.error("Error generating report PDF", error);
    }
};
