
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User } from '../types';

export interface PDFConfig {
    title: string;
    filename: string;
    details?: { label: string; value: string }[];
    table: {
        headers: string[];
        data: any[][];
    };
    orientation?: 'p' | 'portrait' | 'l' | 'landscape';
    user?: User | null;
}

export const generateStandardPDF = (config: PDFConfig) => {
    const doc: any = new jsPDF(config.orientation || 'p');

    // 1. Header & Title (Uppercase)
    doc.setFontSize(16);
    doc.text(config.title.toUpperCase(), 14, 15);

    // 2. Details Section (Uppercase)
    if (config.details && config.details.length > 0) {
        doc.setFontSize(12);
        let currentY = 22;

        config.details.forEach(detail => {
            const text = `${detail.label.toUpperCase()}: ${detail.value.toUpperCase()}`;
            doc.text(text, 14, currentY);
            currentY += 6;
        });
    }

    // 3. Table
    const startY = config.details ? 15 + (config.details.length * 6) + 10 : 25;

    // Convert keys/text to uppercase for standard tables
    const processedTableData = config.table.data.map(row =>
        row.map(cell => {
            if (typeof cell === 'object' && cell !== null) return cell;
            return String(cell).toUpperCase();
        })
    );

    const upperHeaders = [config.table.headers.map(h => h.toUpperCase())];

    autoTable(doc, {
        startY: startY,
        head: upperHeaders,
        body: processedTableData,
        theme: 'grid',
        headStyles: {
            fillColor: [234, 88, 12], // Orange-600
            halign: 'center',
            valign: 'middle',
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2,
            valign: 'middle',
            halign: 'center',
            overflow: 'linebreak'
        },
        didDrawCell: (data: any) => {
            if (data.cell.raw && typeof data.cell.raw === 'object' && data.cell.raw.images) {
                const { images } = data.cell.raw;
                if (images && images.length > 0) {
                    const cellWidth = data.cell.width;
                    const cellHeight = data.cell.height;
                    const x = data.cell.x;
                    const y = data.cell.y;

                    // Standard tiny thumbnail render for generic tables (if any)
                    try {
                        const img = images[0];
                        const size = Math.min(cellWidth - 2, cellHeight - 2, 10); // Small size
                        doc.addImage(img, 'JPEG', x + 1, y + 1, size, size);
                    } catch (e) { }
                }
            }
        },
    });

    // 4. Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const str = "INFORMAÇÃO EXTRAÍDA DO APLICATIVO DA OE-SESCINC MED MAIS. GERADO POR: " +
            (config.user?.name.toUpperCase() || 'USUÁRIO') + " - CPF: " + (config.user?.cpf || '000.000.000-00') +
            " EM " + new Date().toLocaleDateString('pt-BR') + " ÀS " + new Date().toLocaleTimeString('pt-BR') +
            ". © OE-SESCINC MED MAIS. TODOS OS DIREITOS RESERVADOS.";

        doc.setFontSize(7);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();

        const text = doc.splitTextToSize(str, pageWidth - 20);
        doc.text(text, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // 5. Save
    const parseFilename = config.filename.toUpperCase().replace(/\s+/g, '_');
    const finalFilename = parseFilename.endsWith('.PDF') ? parseFilename : `${parseFilename}.PDF`;

    doc.save(finalFilename);
};
