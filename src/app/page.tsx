"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Home.module.css';
import { FileUpload } from '@/components/FileUpload';
import { CameraCapture } from '@/components/CameraCapture';
import { ImageCropper } from '@/components/Cropper';
import { PDFPreview } from '@/components/PDFPreview';
import { Button } from '@/components/Button';
import { ImageModal } from '@/components/ImageModal';
import { loadOpenCV, detectDocument, warpPerspective } from '@/utils/imageProcessing';
import { generatePDF, toDataURL } from '@/utils/pdfGenerator';
import { Point, Area } from 'react-easy-crop';

type Step = 'upload' | 'crop' | 'preview';
type Side = 'front' | 'back';

export default function Home() {
  // State
  const [step, setStep] = useState<Step>('upload');
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
      } // We cannot use set state immediately for processing below as state update is async

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

  const startCameraFor = (side: Side) => {
    setCameraSide(side);
    setShowCamera(true);
  };

  const handleCameraCapture = async (file: File) => {
    setShowCamera(false);
    await handleFileSelect(file, cameraSide);
  };

  const startCropping = (side: Side) => {
    setActiveSide(side);
    setStep('crop');
    // If not loaded, we can't really crop? Well we have the file.
  };

  const handleCropConfirm = (croppedArea: Area, croppedAreaPixels: Area) => {
    // We need to actually crop the image here to get the resulting data URL.
    // react-easy-crop gives us coordinates. We need to use a canvas to crop it.

    // Helper function to crop
    const imageSrc = activeSide === 'front' ? frontFile : backFile;
    if (!imageSrc) return;

    getCroppedImg(imageSrc, croppedAreaPixels).then((croppedUrl) => {
      if (activeSide === 'front') {
        setFrontCropped(croppedUrl);
      } else {
        setBackCropped(croppedUrl);
      }
      setStep('upload'); // Go back to dashboard
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

  const handleGeneratePDF = async () => {
    if (!frontCropped && !backCropped) {
      alert("Please process at least one image.");
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBlob = await generatePDF({
        frontImage: frontCropped,
        backImage: backCropped
      });

      // Download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "id-card-print.pdf";
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

  // Render Helpers
  const renderUploadSlot = (side: Side) => {
    const file = side === 'front' ? frontFile : backFile;
    const cropped = side === 'front' ? frontCropped : backCropped;
    const label = side === 'front' ? 'Front Side' : 'Back Side';

    return (
      <div className={styles.cardSlot}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>{label}</span>
          {cropped ? (
            <span className={`${styles.statusProps} ${styles.statusDone}`}>Ready</span>
          ) : file ? (
            <span className={styles.statusProps}>Uploaded</span>
          ) : (
            <span className={styles.statusProps}>Empty</span>
          )}
        </div>

        {file ? (
          <>
            <div className={styles.previewContainer3D}>
              <img
                src={cropped || file}
                alt={`${side} preview`}
                className={styles.previewImage}
                onClick={() => setZoomedImage(cropped || file)}
                title="Click to zoom"
              />
            </div>
            <div className={styles.actionArea}>
              <Button onClick={() => startCropping(side)} variant="secondary">
                {cropped ? 'Edit Crop' : 'Crop & Process'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (side === 'front') { setFrontFile(null); setFrontCropped(null); }
                  else { setBackFile(null); setBackCropped(null); }
                }}
                style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: 'none' }}
              >
                Clear
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.actionArea}>
            <FileUpload
              label={`Upload ${label}`}
              onFileSelect={(f) => handleFileSelect(f, side)}
            />
            <Button variant="secondary" onClick={() => startCameraFor(side)}>
              Take Photo
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Main Render
  return (
    <main className={styles.main}>
      {isProcessing && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <p>Processing...</p>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {zoomedImage && (
        <ImageModal
          src={zoomedImage}
          onClose={() => setZoomedImage(null)}
        />
      )}

      <div className={styles.hero}>
        <h1>RealSize ID PDF</h1>
        <p>Upload your ID card photos, crop them, and download a print-ready A4 PDF.</p>
      </div>

      {step === 'upload' && (
        <>
          <div className={styles.cardsGrid}>
            {renderUploadSlot('front')}
            {renderUploadSlot('back')}
          </div>

          {(frontCropped || backCropped) && (
            <div className={styles.actionArea} style={{ alignItems: 'center' }}>
              <Button onClick={() => setStep('preview')} style={{ width: '100%', maxWidth: '300px' }}>
                Preview PDF
              </Button>
            </div>
          )}
        </>
      )}

      {step === 'crop' && activeSide && (
        <div style={{ width: '100%', maxWidth: '800px', height: '80vh' }}>
          <h2 className={styles.stepTitle}>Crop {activeSide === 'front' ? 'Front' : 'Back'} Side</h2>
          <ImageCropper
            imageSrc={(activeSide === 'front' ? frontFile : backFile) || ''}
            onCancel={() => { setStep('upload'); setActiveSide(null); }}
            onConfirm={() => {
              if (cropPixelsRef.current) {
                handleCropConfirm({} as Area, cropPixelsRef.current);
              }
            }}
            onCropComplete={(area, pixels) => {
              cropPixelsRef.current = pixels;
            }}
          />
        </div>
      )}

      {step === 'preview' && (
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          <h2 className={styles.stepTitle}>Print Preview</h2>
          <PDFPreview frontImage={frontCropped} backImage={backCropped} />

          <div className={styles.actionArea} style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Button variant="secondary" onClick={() => setStep('upload')}>Back to Edit</Button>
            <Button onClick={handleGeneratePDF}>Download PDF</Button>
          </div>
        </div>
      )}
    </main>
  );
}
