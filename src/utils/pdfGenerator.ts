import { jsPDF } from 'jspdf';

interface GeneratePDFParams {
    frontImage: string | null;
    backImage: string | null;
}

export const generatePDF = async ({ frontImage, backImage }: GeneratePDFParams): Promise<Blob> => {
    // A4 size in mm: 210 x 297
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;

    // Standard ID Card: 85.6mm x 54mm
    const cardWidth = 85.6;
    const cardHeight = 54;

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
        // Add Front Image
        // We assume image data is base64 or valid URL. jsPDF handles base64 well.
        // If it's a blob URL, we might need to convert to base64 first. 
        // But react-easy-crop usually gives base64 or blob.
        // If it's a blob URL, addImage supports it in recent versions? 
        // Safer to convert if needed, but let's assume base64 for now as per react-easy-crop `toDataURL` usually used.

        // Check if it's base64, if not, fetch it?
        // Let's assume input is base64 data URL.

        doc.addImage(frontImage, 'JPEG', x, startY, cardWidth, cardHeight);

        // Add label or border?
        // Standard ID copy usually doesn't strictly need a label, but helps.
        // Let's keep it clean.

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
