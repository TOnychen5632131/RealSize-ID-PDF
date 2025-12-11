import React, { useRef } from 'react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    label: string; // New required prop
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    accept = "image/*",
    label
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
                {/* Icon: White Squircle with Plus */}
                <div className={styles.iconWrapper}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6V18" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M6 12H18" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                </div>

                <span className={styles.mainText}>{label}</span>
                {/* Removed subtext as requested */}
            </div>
        </div>
    );
};
