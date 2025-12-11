import React from 'react';
import styles from './ImageModal.module.css';

interface ImageModalProps {
    src: string;
    onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ src, onClose }) => {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <img src={src} alt="Enlarged preview" className={styles.image} />
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                <p className={styles.hint}>Click outside to close</p>
            </div>
        </div>
    );
};
