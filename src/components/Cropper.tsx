import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { Button } from './Button';
import styles from './Cropper.module.css';

interface ImageCropperProps {
    imageSrc: string;
    initialCrop?: Point;
    aspect?: number; // Optional aspect ratio
    onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
    imageSrc,
    aspect = 85.6 / 54, // Default to ID-1
    onCropComplete,
    onCancel,
    onConfirm
}) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    return (
        <div className={styles.container}>
            <div className={styles.cropperWrapper}>
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onCropComplete={onCropComplete}
                    onZoomChange={onZoomChange}
                />
            </div>
            <div className={styles.controls}>
                <div className={styles.sliderContainer}>
                    <label>Zoom</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>
                <div className={styles.buttons}>
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onConfirm}>Confirm Crop</Button>
                </div>
            </div>
        </div>
    );
};
