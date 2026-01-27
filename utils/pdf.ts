
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

export const generateStandardPDF = async (config: PDFConfig) => {
    const doc: any = new jsPDF(config.orientation || 'p');

    // 0. Load Background Image (if any)
    let bgImage: HTMLImageElement | null = null;
    if (config.backgroundImage) {
        try {
            bgImage = await loadImage(config.backgroundImage);
        } catch (e) {
            console.error('Failed to load background image:', e);
        }
    }

    // Helper to add background to current page
    const addBackground = () => {
        if (bgImage) {
            const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            doc.addImage(bgImage, 'PNG', 0, 0, pageWidth, pageHeight);
        }
    };

    // Add background to first page
    addBackground();

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

    const originalAddPage = doc.addPage;
    doc.addPage = function () {
        const ret = originalAddPage.apply(this, arguments);
        addBackground();
        return ret;
    };

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
        didDrawPage: (data) => {
            // Add background to new pages (automatically added by autoTable)
            // Note: didDrawPage is called AFTER the page is added but BEFORE content? 
            // Actually autoTable adds a new page, hooks might be needed.
            // But simpler: we can loop pages at the end if we want to be sure, 
            // OR use didDrawPage. Let's try looping at the end to force z-index "under" 
            // (actually jsPDF paints in order, so "under" means painting BEFORE text).
            // If I paint at the end, it will be ON TOP.
            // So I must use hooks or paint before content.
            // autoTable hook `didDrawPage` is useful for headers/footers.

            // Issue: autoTable manages page breaks.
            // If I use `didDrawPage`, I can draw the image. 
            // But `didDrawPage` might be called after some content?
            // "didDrawPage" is called after the plugin has finished drawing everything on the page? No.
            // Documentation: "Called after the plugin has finished drawing the table on the page"

            // Better approach with jsPDF:
            // 1. Generate everything.
            // 2. Loop through all pages.
            // 3. Move to page -> Add Image -> Oops, that puts it on top.

            // Correct approach with jsPDF for Background:
            // Use `didDrawPage` hook of autoTable to draw background ONLY if it's a new page.
            // BUT `didDrawPage` happens after table content?
            // Let's check `willDrawPage` or similar? No such thing easily exposed in this version maybe.

            // ALTERNATIVE: Use the `hooks` to restart. 
            // OR: Since `doc` is mutable, I can just use `didDrawPage` and set global composite operation? No.

            // Simplest robust way: 
            // Loop pages at end, but that covers text.

            // Let's stick to `didDrawPage`. doc.addImage usually overwrites?
            // If the background is transparent (watermark), it might be fine on top?
            // The user provided image looks opaque white with sidebar. It will COVER text if on top.

            // So I MUST draw it first.
            // `didDrawPage` is called *after* everything on that page is drawn by autoTable?
            // Let's verify autoTable docs (mental check).
            // `didDrawPage` is called after the table is drawn on the page.

            // Wait, `hooks`: `didParseCell`, `willDrawCell`, `didDrawCell`, `willDrawPage`?
            // Older versions had `addPageContent`.

            // Let's try `willDrawPage` if available? 
            // Check types... autoTable types not fully visible.

            // Hack: Modifying `doc.addPage`?
            // The safest "underneath" method with existing jsPDF + autoTable:
            // 1. Add background to Page 1 manually (done).
            // 2. For subsequent pages, autoTable calls `doc.addPage()`.
            // We can monkey-patch `doc.addPage` temporarily?
        },
    });

    // FIX: autoTable hooks are tricky for "underneath" background.
    // However, the user wants "background".
    // Let's try to monkeypatch addPage for this instance, it's a common valid strategy in jsPDF.

    // Monkey patch active for subsequent pages if needed, though usually autoTable does the heavy lifting.
    // No need to re-patch.

    // Wait, autoTable is already running. Monkey patching needs to happen BEFORE autoTable.

    // Let's refactor:
    // 1. Monkey patch doc.addPage
    // 2. Run autoTable
    // 3. Restore doc.addPage (optional but good)

    // Wait, I messed up the order in my thought process. 
    // `autoTable` is called synchronously. 
    // If I patch `doc.addPage` before `autoTable`, it should work.

    // BUT `generateStandardPDF` logic being replaced below.

    // Let's rewrite the replacement content to include the monkey patch.

    const pageCount = doc.internal.getNumberOfPages();
    // Re-loop to adding footer is fine (on top).
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // If we didn't use the monkeypatch, we can try to mess with the PDF object stream, but that's hard.
        // Let's use the monkeypatch strategy in the replacement.

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
