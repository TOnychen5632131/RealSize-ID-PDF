import React from 'react';
import styles from './PDFPreview.module.css';

interface PDFPreviewProps {
    frontImage: string | null;
    backImage: string | null;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ frontImage, backImage }) => {
    return (
        <div className={styles.container}>
            <div className={styles.a4Paper}>
                <div className={styles.content}>
                    {/* Visual representation of A4 page with cards */}
                    {/* Card Dimensions: 85.6mm x 54mm. A4: 210mm x 297mm. */}
                    {/* Scale: We can use CSS to scale it or just use aspect ratios. */}
                    {/* Let's say 1px = 1mm for simplicity in this container, then scale down. */}

                    <div className={styles.cardsContainer}>
                        {frontImage && (
                            <div className={styles.cardWrapper}>
                                <img src={frontImage} alt="Front ID" className={styles.cardImage} />
                            </div>
                        )}
                        {backImage && (
                            <div className={styles.cardWrapper}>
                                <img src={backImage} alt="Back ID" className={styles.cardImage} />
                            </div>
                        )}
                        {!frontImage && !backImage && (
                            <div className={styles.emptyState}>No images selected</div>
                        )}
                    </div>
                </div>
            </div>
            <p className={styles.hint}>Preview of A4 layout</p>
        </div>
    );
};
