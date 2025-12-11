import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from './Button';
import styles from './CameraCapture.module.css';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer back camera on mobile
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access camera. Please ensure permissions are granted.");
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            // Cleanup stream on unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onCapture(file);

                        // Stop stream after capture
                        if (stream) {
                            stream.getTracks().forEach(track => track.stop());
                        }
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Take Photo</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <div className={styles.videoContainer}>
                    {error ? (
                        <div className={styles.error}>{error}</div>
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className={styles.video} />
                    )}
                </div>

                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    {!error && (
                        <Button onClick={captureImage}>Capture</Button>
                    )}
                </div>
            </div>
        </div>
    );
};
