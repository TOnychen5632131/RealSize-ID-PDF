import { jsPDF } from 'jspdf';

interface GeneratePDFParams {
    frontImage: string | null;
    backImage: string | null;
    width?: number;  // mm
    height?: number; // mm
}

export const generatePDF = async ({
    frontImage,
    backImage,
    width = 85.6,
    height = 54
}: GeneratePDFParams): Promise<Blob> => {
    // A4 size in mm: 210 x 297
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const cardWidth = width;
    const cardHeight = height;

    // Margins/Spacing
    const spacing = 10; // 10mm gap between front and back

    // Calculate positions
    // Center horizontally
    const x = (pageWidth - cardWidth) / 2;

    // For vertical positioning:
    // If both images, center the group vertically
    // If one image, center it vertically

    let totalContentHeight = 0;
    if (frontImage) totalContentHeight += cardHeight;
    if (backImage) totalContentHeight += cardHeight;
    if (frontImage && backImage) totalContentHeight += spacing;

    let startY = (pageHeight - totalContentHeight) / 2;

    if (frontImage) {
        doc.addImage(frontImage, 'JPEG', x, startY, cardWidth, cardHeight);
        startY += cardHeight + spacing;
    }

    if (backImage) {
        doc.addImage(backImage, 'JPEG', x, startY, cardWidth, cardHeight);
    }

    // Return as Blob
    return doc.output('blob');
};

/**
 * Helper to convert Blob URL or File to Base64 Data URL
 */
export const toDataURL = (url: string | File): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (url instanceof File) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(url);
        } else {
            // If it's a blob URL
            fetch(url)
                .then(res => res.blob())
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                })
                .catch(reject);
        }
    });
};
