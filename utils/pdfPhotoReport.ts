
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User } from '../types';

export interface PhotoPDFConfig {
    title: string;
    filename: string;
    details?: { label: string; value: string }[];
    data: any[][]; // The row data
    user?: User | null;
    backgroundImage?: string;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
    });
};

export const generatePhotoReportPDF = async (config: PhotoPDFConfig) => {
    const doc: any = new jsPDF('p'); // Portrait

    // 0. Load Background Image (if any)
    let bgImage: HTMLImageElement | null = null;
    if (config.backgroundImage) {
        try {
            bgImage = await loadImage(config.backgroundImage);
        } catch (e) {
            console.error('Failed to load background image:', e);
        }
    }

    const addBackground = () => {
        if (bgImage) {
            const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            // Draw at 0,0 with full width/height
            doc.addImage(bgImage, 'PNG', 0, 0, pageWidth, pageHeight);
        }
    };

    // Calculate Header Height
    // Title (approx 10) + Details (6 each) + Padding (10)
    const detailsHeight = (config.details?.length || 0) * 6;
    const headerHeight = 15 + detailsHeight + 10;

    // Header Drawing Function
    const drawHeader = (data: any) => {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(config.title.toUpperCase(), 14, 15);

        if (config.details && config.details.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            let currentY = 22;
            config.details.forEach(detail => {
                const text = `${detail.label.toUpperCase()}: ${detail.value.toUpperCase()}`;
                doc.text(text, 14, currentY);
                currentY += 6;
            });
        }
    };

    // 3. Table Configuration (Chunked to 3 Items Per Page)
    const itemsPerPage = 3;
    const totalPages = Math.ceil(config.data.length / itemsPerPage);

    // Margins from User Request
    const MARGIN_TOP = 30;
    const MARGIN_BOTTOM = 27;

    for (let i = 0; i < totalPages; i++) {
        // Add new page for chunk 2+
        if (i > 0) {
            doc.addPage();
        }

        // Add Background (First thing on the page)
        addBackground();

        const currentData = config.data.slice(i * itemsPerPage, (i + 1) * itemsPerPage);

        // Draw Header (within the 30mm top margin)
        // Position info: Title at Y=15, Details start at Y=22
        drawHeader(null);

        autoTable(doc, {
            startY: MARGIN_TOP,
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM },
            head: [['FOTO', 'MATÉRIA']],
            body: currentData,
            theme: 'grid',
            headStyles: {
                fillColor: [234, 88, 12],
                halign: 'center',
                valign: 'middle',
                fontStyle: 'bold'
            },
            bodyStyles: {
                minCellHeight: 75, // Reduced to 75mm as requested
                valign: 'middle',
                fontSize: 10,
                textColor: 0
            },
            columnStyles: {
                0: { cellWidth: 110, halign: 'center' },
                1: { halign: 'center' }
            },
            // Remove didDrawPage from here to avoid duplicate header calls or complexities. 
            // We called drawHeader() manually above.
            didDrawCell: (data: any) => {
                // Render Image in Column 0
                if (data.section === 'body' && data.column.index === 0 && data.cell.raw && typeof data.cell.raw === 'object') {
                    const { images } = data.cell.raw;
                    if (images && images.length > 0) {
                        try {
                            const img = images[0];
                            const cellWidth = data.cell.width;
                            const cellHeight = data.cell.height;
                            const padding = 2;

                            const w = cellWidth - (padding * 2);
                            const h = cellHeight - (padding * 2);

                            doc.addImage(img, 'JPEG', data.cell.x + padding, data.cell.y + padding, w, h);
                        } catch (e) { }
                    }
                }
            }
        });
    }

    // 4. Traceability Footer (within the 27mm bottom margin)
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

        // Position footer: Page Height - (Half of Margin + some padding) ~ 15mm from bottom
        const text = doc.splitTextToSize(str, pageWidth - 20);
        doc.text(text, pageWidth / 2, pageHeight - 15, { align: 'center' });
    }

    // Save
    const parseFilename = config.filename.toUpperCase().replace(/\s+/g, '_');
    const finalFilename = parseFilename.endsWith('.PDF') ? parseFilename : `${parseFilename}.PDF`;
    doc.save(finalFilename);
};
