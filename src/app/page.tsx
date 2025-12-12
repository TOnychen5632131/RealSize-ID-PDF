"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './Home.module.css';
import { FileUpload } from '@/components/FileUpload';
import { CameraCapture } from '@/components/CameraCapture';
import { ImageCropper } from '@/components/Cropper';
import { PDFPreview } from '@/components/PDFPreview';
import { Button } from '@/components/Button';
import { ImageModal } from '@/components/ImageModal';
import { FloatingCards } from '@/components/FloatingCards';
import { Navbar } from '@/components/Navbar';
import { SegmentedControl } from '@/components/SegmentedControl';
import { loadOpenCV, detectDocument, warpPerspective } from '@/utils/imageProcessing';
import { generatePDF, toDataURL } from '@/utils/pdfGenerator';
import { Area } from 'react-easy-crop';

type Step = 'upload' | 'crop' | 'preview';
type Side = 'front' | 'back';

export default function Home() {
    // State
    const [step, setStep] = useState<Step>('upload');
    const [docType, setDocType] = useState<'id' | 'passport'>('id');
    const [activeSide, setActiveSide] = useState<Side | null>(null);

    const [frontFile, setFrontFile] = useState<string | null>(null);
    const [backFile, setBackFile] = useState<string | null>(null);

    const [frontCropped, setFrontCropped] = useState<string | null>(null);
    const [backCropped, setBackCropped] = useState<string | null>(null);

    const [showCamera, setShowCamera] = useState(false);
    const [cameraSide, setCameraSide] = useState<Side>('front');

    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [cvLoaded, setCvLoaded] = useState(false);

    const cropPixelsRef = React.useRef<Area | null>(null);

    // Derived Dims based on DocType
    // ID-1: 85.6 x 54 mm (Aspect: 1.585)
    // ID-3: 125 x 88 mm (Aspect: 1.42)
    const getDocDims = () => {
        if (docType === 'passport') return { width: 125, height: 88, aspect: 125 / 88 };
        return { width: 85.6, height: 54, aspect: 85.6 / 54 };
    };

    const dims = getDocDims();

    // Initialize OpenCV
    useEffect(() => {
        loadOpenCV().then(() => {
            console.log("OpenCV loaded");
            setCvLoaded(true);
        }).catch(console.error);
    }, []);

    // Handlers
    const handleFileSelect = async (file: File, side: Side) => {
        setIsProcessing(true);
        try {
            const dataUrl = await toDataURL(file);

            // Update state with original file first
            if (side === 'front') {
                setFrontFile(dataUrl);
                setFrontCropped(null);
            } else {
                setBackFile(dataUrl);
                setBackCropped(null);
            }

            // Auto-Crop Attempt
            if (cvLoaded) {
                try {
                    const img = new Image();
                    img.src = dataUrl;
                    await new Promise(r => img.onload = r);

                    const points = await detectDocument(img);
                    if (points && points.length === 4) {
                        console.log(`[Auto-Crop] Detected document edges at:`, points);
                        const warped = await import('@/utils/imageProcessing').then(m => m.warpPerspective(img, points));
                        if (warped) {
                            console.log(`[Auto-Crop] Perspective warp successful for ${side} side.`);
                            if (side === 'front') setFrontCropped(warped);
                            else setBackCropped(warped);
                        } else {
                            console.warn(`[Auto-Crop] Perspective warp returned null.`);
                        }
                    } else {
                        console.log(`[Auto-Crop] Failed to detect 4 clear corners. Found:`, points);
                    }
                } catch (cvErr) {
                    console.error("Auto-crop failed, falling back to manual", cvErr);
                }
            }

        } catch (e) {
            console.error(e);
            alert("Error reading file");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCameraCapture = async (file: File) => {
        setShowCamera(false);
        await handleFileSelect(file, cameraSide);
    };

    const startCropping = (side: Side) => {
        setActiveSide(side);
        // Reset crop ref to null if needed, or keep last?
        cropPixelsRef.current = null;
        setStep('crop');
    };

    const handleCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
        cropPixelsRef.current = croppedAreaPixels;
    };

    const handleConfirmCrop = () => {
        if (!cropPixelsRef.current) return;
        const imageSrc = activeSide === 'front' ? frontFile : backFile;
        if (!imageSrc) return;

        getCroppedImg(imageSrc, cropPixelsRef.current).then((croppedUrl) => {
            if (activeSide === 'front') {
                setFrontCropped(croppedUrl);
            } else {
                setBackCropped(croppedUrl);
            }
            setStep('upload');
            setActiveSide(null);
        }).catch(e => {
            console.error(e);
            alert("Error cropping image");
        });
    };

    // Helper to crop image
    const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('No 2d context');

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return canvas.toDataURL('image/jpeg');
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.src = url;
        });

    const handleDownload = async () => {
        if (!frontCropped && !backCropped) {
            alert("Please process at least one image.");
            return;
        }

        setIsProcessing(true);
        try {
            const pdfBlob = await generatePDF({
                frontImage: frontCropped,
                backImage: backCropped,
                width: dims.width,
                height: dims.height
            });

            // Download
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `realsize-${docType}-print.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (e) {
            console.error(e);
            alert("Error generating PDF");
        } finally {
            setIsProcessing(false);
        }
    };

    // Main Render
    return (
        <>
            <FloatingCards />
            <Navbar />

            <main className={styles.main}>
                <div className={styles.landingSection}>
                    <div className={styles.hero}>
                        <h1 style={{ fontSize: '4rem', marginBottom: '0' }}>RealSize ID PDF</h1>
                    </div>

                    <div className={styles.contentCard}>
                        {step === 'upload' && (
                            <>
                                {/* Document Type Switcher */}
                                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                                    <SegmentedControl
                                        options={[
                                            { label: 'Standard ID Card', value: 'id' },
                                            { label: 'Passport (ID-3)', value: 'passport' }
                                        ]}
                                        value={docType}
                                        onChange={(v) => setDocType(v as any)}
                                    />
                                </div>

                                <div
                                    className={styles.uploadGrid}
                                    style={{ gridTemplateColumns: docType === 'passport' ? '1fr' : '1fr 1fr' }}
                                >
                                    {/* Front Side */}
                                    <div className={styles.uploadItem}>
                                        {/* h3 removed, label moved to prop */}
                                        {frontFile ? (
                                            <div>
                                                <img
                                                    src={frontCropped || frontFile}
                                                    className={styles.previewImage}
                                                    onClick={() => setZoomedImage(frontCropped || frontFile)}
                                                    style={{ cursor: 'zoom-in' }}
                                                    alt="Front Preview"
                                                />
                                                <div className={styles.actionArea}>
                                                    <Button size="sm" variant="secondary" onClick={() => startCropping('front')}>Edit</Button>
                                                    <Button size="sm" variant="danger" onClick={() => { setFrontFile(null); setFrontCropped(null); }}>Remove</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <FileUpload
                                                label={docType === 'passport' ? 'Passport Page' : 'Front Side'}
                                                onFileSelect={(f) => handleFileSelect(f, 'front')}
                                                variant={docType === 'passport' ? 'passport' : 'front'}
                                            />
                                        )}
                                    </div>

                                    {/* Back Side - Only for ID Cards */}
                                    {docType === 'id' && (
                                        <div className={styles.uploadItem}>
                                            {/* h3 removed */}
                                            {backFile ? (
                                                <div>
                                                    <img
                                                        src={backCropped || backFile}
                                                        className={styles.previewImage}
                                                        onClick={() => setZoomedImage(backCropped || backFile)}
                                                        style={{ cursor: 'zoom-in' }}
                                                        alt="Back Preview"
                                                    />
                                                    <div className={styles.actionArea}>
                                                        <Button size="sm" variant="secondary" onClick={() => startCropping('back')}>Edit</Button>
                                                        <Button size="sm" variant="danger" onClick={() => { setBackFile(null); setBackCropped(null); }}>Remove</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <FileUpload
                                                    label="Back Side"
                                                    onFileSelect={(f) => handleFileSelect(f, 'back')}
                                                    variant="back"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {(frontFile || backFile) && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <Button onClick={() => setStep('preview')}>
                                            Generate PDF Preview
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {step === 'crop' && activeSide && (
                            <div>
                                <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Adjust {activeSide === 'front' ? 'Front' : 'Back'} Crop</h2>
                                <div style={{ height: '400px', position: 'relative', marginBottom: '1rem' }}>
                                    <ImageCropper
                                        imageSrc={(activeSide === 'front' ? frontFile : backFile) || ''}
                                        /* Pass dynamic aspect ratio based on docType */
                                        aspect={dims.aspect}
                                        onCancel={() => { setStep('upload'); setActiveSide(null); }}
                                        onConfirm={handleConfirmCrop}
                                        onCropComplete={handleCropComplete}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 'preview' && (
                            <div className={styles.previewContainer}>
                                <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Print Preview</h2>
                                <PDFPreview frontImage={frontCropped || frontFile} backImage={backCropped || backFile} />
                                <div className={styles.actionArea} style={{ marginTop: '2rem' }}>
                                    <Button variant="secondary" onClick={() => setStep('upload')}>Back to Edit</Button>
                                    <Button onClick={handleDownload}>Download PDF</Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Text Moved per Request */}
                    <div className={styles.footerText}>
                        <p>
                            AI-calibrated ID card to A4 generator for <strong>85.6mm x 54mm</strong> badges and employee IDs.
                        </p>
                        <p style={{ marginTop: '0.5rem' }}>
                            Upload the front and back, auto-detect edges with OpenCV, adjust manually
                            if needed, and export a print-ready PDF with bleed and margins dialed in.
                        </p>
                    </div>
                </div>

                <motion.section
                    className={styles.seoSection}
                    aria-labelledby="realsize-benefits"
                    initial={{ opacity: 0, y: 100 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    viewport={{ once: true, amount: 0.2 }}
                >
                    <div className={styles.seoHeader}>
                        <h2 id="realsize-benefits">Why RealSize prints IDs that fit every card holder</h2>
                        <p>
                            Built for HR teams, print shops, and event organizers who need consistent, on-scale badges.
                            Keep both sides aligned, avoid margin creep, and deliver professional PDFs without design software.
                        </p>
                    </div>
                    <div className={styles.seoGrid}>
                        <article className={styles.seoCard}>
                            <h3>True-to-scale layout</h3>
                            <p>
                                Generates 85.6mm x 54mm ID cards on A4 with guides that respect printer-safe margins,
                                so your PVC cards, staff IDs, and membership badges stay within ISO/IEC 7810 specs.
                            </p>
                        </article>
                        <article className={styles.seoCard}>
                            <h3>Computer vision clean-up</h3>
                            <p>
                                AI model detects card corners, warps perspective, and keeps headshots centered.
                                Manual crop tools let you finalize edges before downloading the PDF.
                            </p>
                        </article>
                        <article className={styles.seoCard}>
                            <h3>Ready for teams</h3>
                            <p>
                                Double-sided uploads, quick previews, and one-click PDF export streamline onboarding kits,
                                event passes, visitor badges, and student IDs without outsourcing print setup.
                            </p>
                        </article>
                    </div>
                </motion.section>

                <footer className={styles.pageFooter}>
                    <p>Powered by Wendell</p>
                </footer>
            </main >

            {/* Modals */}
            {
                showCamera && (
                    <CameraCapture
                        onCapture={handleCameraCapture}
                        onClose={() => setShowCamera(false)}
                    />
                )
            }

            {
                zoomedImage && (
                    <ImageModal
                        src={zoomedImage}
                        onClose={() => setZoomedImage(null)}
                    />
                )
            }

            {
                isProcessing && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner}></div>
                        <p>Processing...</p>
                    </div>
                )
            }
        </>
    );
}
