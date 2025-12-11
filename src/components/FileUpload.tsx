import React, { useRef } from 'react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    label: string;
    variant?: 'front' | 'back' | 'passport';
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    accept = "image/*",
    label,
    variant = 'front'
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className={styles.container} onClick={handleClick}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={accept}
                className={styles.hiddenInput}
            />

            <div className={styles.innerButton}>
                {/* Decorative Elements */}
                <div className={styles.headerDeco} />

                {variant === 'back' && <div className={styles.chip} />}

                {/* Skeleton Layout */}
                {variant === 'back' ? (
                    <div className={`${styles.skeletonLayout} ${styles.backLayout}`}>
                        <div className={styles.fullWidthLines}>
                            <div className={`${styles.line} ${styles.medium}`} />
                            <div className={`${styles.line} ${styles.long}`} />
                            <div className={`${styles.line} ${styles.long}`} />
                            <div className={`${styles.line} ${styles.short}`} />
                        </div>
                    </div>
                ) : (
                    <div className={styles.skeletonLayout}>
                        {/* Front / Passport Layout: Photo Left */}
                        <div className={styles.photoPlaceholder} />
                        <div className={styles.infoColumn}>
                            <div className={`${styles.line} ${styles.short}`} />
                            <div className={`${styles.line} ${styles.long}`} />
                            <div className={`${styles.line} ${styles.medium}`} />
                            <div className={`${styles.line} ${styles.long}`} />
                        </div>
                    </div>
                )}

                {/* MRZ Strip at Bottom for all */}
                <div className={styles.mrzStrip}>
                    <div className={styles.mrzLine} />
                    <div className={styles.mrzLine} />
                </div>

                {/* Floating Centered Label */}
                <div className={styles.overlayLabel}>
                    + {label}
                </div>
            </div>
        </div>
    );
};
