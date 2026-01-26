
import jsPDF from 'jspdf';
import { User } from '../types';

export interface PDFConfig {
    title: string;
    filename: string;
    details?: { label: string; value: string }[];
    rows: CardRow[]; // Generic data for cards
    user?: User | null;
    itemsPerPage?: number; // Explicit control
}

export interface CardRow {
    images: string[];
    title: string;
    subtitle: string;
}

export const generateCardLayoutPDF = (config: PDFConfig) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const itemsPerPage = config.itemsPerPage || 2;

    // Header & Footer Space
    const headerHeight = 40; // Title + Details
    const footerHeight = 15;
    const availableHeight = pageHeight - headerHeight - footerHeight - (margin * 2);

    // Card Dimensions
    const cardGap = 5;
    // Calculate card height dynamically based on items per page
    const cardHeight = (availableHeight - (cardGap * (itemsPerPage - 1))) / itemsPerPage;
    const cardWidth = pageWidth - (margin * 2);

    let currentPageIdx = 0;

    // Helper: Draw Header
    const drawHeader = () => {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(config.title.toUpperCase(), margin, 15);

        if (config.details) {
            doc.setFontSize(12);
            let detailY = 24;
            config.details.forEach(d => {
                doc.text(`${d.label.toUpperCase()}: ${d.value.toUpperCase()}`, margin, detailY);
                detailY += 6;
            });
        }
    };

    // Helper: Draw Footer
    const drawFooter = () => {
        const str = "GERADO POR: " +
            (config.user?.name.toUpperCase() || 'USUÁRIO') +
            " EM " + new Date().toLocaleDateString('pt-BR') + " " + new Date().toLocaleTimeString('pt-BR');

        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    // Initial Page
    drawHeader();
    drawFooter();

    config.rows.forEach((row, index) => {
        // New Page Check
        if (index > 0 && index % itemsPerPage === 0) {
            doc.addPage();
            currentPageIdx++;
            drawHeader();
            drawFooter();
        }

        // Calculate Y Position for this card on the current page
        const itemOnPage = index % itemsPerPage;
        const startY = headerHeight + margin + (itemOnPage * (cardHeight + cardGap));

        // --- DRAW CARD ---

        // 1. Outline
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, startY, cardWidth, cardHeight);

        // Layout Constants inside Card
        const bottomStripHeight = 12;
        const titleStripHeight = 12;
        const imageAreaHeight = cardHeight - bottomStripHeight - titleStripHeight;

        const titleY = startY + imageAreaHeight;
        const subtitleY = startY + imageAreaHeight + titleStripHeight;

        // 2. Image Area (Top)
        if (row.images && row.images.length > 0) {
            try {
                const img = row.images[0];
                const imgPadding = 2;
                const imgW = cardWidth - (imgPadding * 2);
                const imgH = imageAreaHeight - (imgPadding * 2);

                // Centering/Fitting
                doc.addImage(img, 'JPEG', margin + imgPadding, startY + imgPadding, imgW, imgH);
            } catch (e) {
                // console.warn("Image error", e);
            }
        }

        // 3. Title Strip (Middle)
        // Separator Line
        doc.line(margin, titleY, margin + cardWidth, titleY);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);

        // Center Text
        const textX = margin + (cardWidth / 2);
        const textY = titleY + (titleStripHeight / 2) + 1.5; // +1.5 for visual centering

        // Text Wrapping
        const titleText = doc.splitTextToSize(row.title.toUpperCase(), cardWidth - 4);
        doc.text(titleText, textX, textY, { align: 'center', baseline: 'middle' });

        // 4. Subtitle Strip (Bottom)
        // Separator Line
        doc.line(margin, subtitleY, margin + cardWidth, subtitleY);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);

        const subX = margin + (cardWidth / 2);
        const subY = subtitleY + (bottomStripHeight / 2) + 1.5;

        const subText = doc.splitTextToSize(row.subtitle.toUpperCase(), cardWidth - 4);
        doc.text(subText, subX, subY, { align: 'center', baseline: 'middle' });
    });

    // Save
    const parseFilename = config.filename.toUpperCase().replace(/\s+/g, '_');
    const finalFilename = parseFilename.endsWith('.PDF') ? parseFilename : `${parseFilename}.PDF`;
    doc.save(finalFilename);
};
