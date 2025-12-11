import React from 'react';
import { motion, Variants } from 'framer-motion';
import styles from './PDFPreview.module.css';

interface PDFPreviewProps {
    frontImage: string | null;
    backImage: string | null;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ frontImage, backImage }) => {
    // Animation Variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.3
            }
        }
    };

    const paperVariants: Variants = {
        hidden: { scale: 0.8, opacity: 0, y: 50 },
        visible: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const cardVariants: Variants = {
        hidden: {
            scale: 1.5,
            opacity: 0,
            y: -100,
            rotate: Math.random() * 10 - 5, // Slight random tilt
            boxShadow: "0px 20px 40px rgba(0,0,0,0.3)" // Floating shadow
        },
        visible: {
            scale: 1,
            opacity: 1,
            y: 0,
            rotate: 0,
            boxShadow: "none", // "Drop" effect
            transition: {
                type: "spring",
                damping: 15,
                stiffness: 100,
                mass: 0.8
            }
        }
    };

    return (
        <motion.div
            className={styles.container}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className={styles.a4Paper} variants={paperVariants}>
                <div className={styles.content}>
                    <div className={styles.cardsContainer}>
                        {frontImage && (
                            <motion.div
                                className={styles.cardWrapper}
                                variants={cardVariants}
                                style={{ originX: 0.5, originY: 0.5 }} // Ensure scaling from center
                            >
                                <img src={frontImage} alt="Front ID" className={styles.cardImage} />
                            </motion.div>
                        )}
                        {backImage && (
                            <motion.div
                                className={styles.cardWrapper}
                                variants={cardVariants}
                            >
                                <img src={backImage} alt="Back ID" className={styles.cardImage} />
                            </motion.div>
                        )}
                        {!frontImage && !backImage && (
                            <div className={styles.emptyState}>No images selected</div>
                        )}
                    </div>
                </div>

                {/* Decorative 'Processing' lines or subtle scanner effect could go here */}
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className={styles.scanLine}
                />
            </motion.div>
            <motion.p
                className={styles.hint}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
            >
                Ready for printing (A4 Standard)
            </motion.p>
        </motion.div>
    );
};
