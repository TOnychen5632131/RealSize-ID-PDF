import React from 'react';
import styles from './SegmentedControl.module.css';

interface Option {
    label: string;
    value: string;
}

interface SegmentedControlProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange }) => {
    return (
        <div className={styles.container}>
            {options.map((option) => (
                <button
                    key={option.value}
                    className={`${styles.segment} ${value === option.value ? styles.active : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                    {value === option.value && <div className={styles.backdrop} />}
                </button>
            ))}
        </div>
    );
};
