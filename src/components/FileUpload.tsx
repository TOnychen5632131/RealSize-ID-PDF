import React, { useCallback, useState } from 'react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    label?: string;
    onCameraClick?: () => void;
    accept?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    label,
    onCameraClick,
    accept = "image/*"
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [onFileSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    }, [onFileSelect]);

    return (
        <div
            className={`${styles.container} ${isDragOver ? styles.active : ''}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
        >
            <input
                type="file"
                accept={accept}
                onChange={handleChange}
                style={{ display: 'none' }}
                id={`file-upload-${label}`}
            />
            <label htmlFor={`file-upload-${label}`} style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>

                {/* The Inner Gradient Button */}
                <div className={styles.innerButton}>
                    <div className={styles.icon}>+</div>
                    <span className={styles.label}>{label || "Add Files"}</span>
                </div>

                {onCameraClick && (
                    <button
                        type="button"
                        className={styles.cameraBtn}
                        onClick={(e) => { e.stopPropagation(); onCameraClick(); }}
                    >
                        📸 Camera
                    </button>
                )}
            </label>
        </div>
    );
};
