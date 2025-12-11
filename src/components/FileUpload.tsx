import React, { useCallback, useState } from 'react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
    label: string;
    onFileSelect: (file: File) => void;
    accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    label,
    onFileSelect,
    accept = "image/*"
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [onFileSelect]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div
            className={`${styles.uploadZone} ${isDragOver ? styles.dragOver : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className={styles.hiddenInput}
                id={`file-upload-${label}`}
            />
            <label htmlFor={`file-upload-${label}`} className={styles.uploadLabel}>
                <div className={styles.icon}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M9 11L12 8L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M3 15V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
                <span className={styles.text}>{label}</span>
                <span className={styles.subtext}>Drag & Drop or Click to Upload</span>
            </label>
        </div>
    );
};
