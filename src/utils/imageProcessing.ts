export interface CVState {
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;
}

// Singleton to track loading state
let isOpenCVLoaded = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

export const loadOpenCV = (): Promise<void> => {
    if (isOpenCVLoaded) return Promise.resolve();
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error("Cannot load OpenCV on server side"));
            return;
        }

        // Check if script already exists
        if (document.getElementById('opencv-script')) {
            if ((window as any).cv) {
                isOpenCVLoaded = true;
                resolve();
            }
            return;
        }

        isLoading = true;
        const script = document.createElement('script');
        script.id = 'opencv-script';
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js'; // Use valid CDN version
        script.async = true;

        script.onload = () => {
            // OpenCV.js takes some time to initialize strictly even after onload
            if ((window as any).cv) {
                (window as any).cv['onRuntimeInitialized'] = () => {
                    isOpenCVLoaded = true;
                    isLoading = false;
                    resolve();
                };
                // Fallback if already initialized?
                if ((window as any).cv.Mat) {
                    isOpenCVLoaded = true;
                    isLoading = false;
                    resolve();
                }
            } else {
                reject(new Error("OpenCV implementation not found"));
            }
        };

        script.onerror = () => {
            isLoading = false;
            loadPromise = null;
            reject(new Error("Failed to load OpenCV.js"));
        };

        document.body.appendChild(script);
    });

    return loadPromise;
};

/**
 * Detects document edges in an image using multi-pass detection.
 * Returns normalized coordinates containing the 4 corners of the document.
 */
export const detectDocument = async (imageSource: HTMLImageElement | HTMLCanvasElement): Promise<{ x: number, y: number }[] | null> => {
    if (!isOpenCVLoaded) {
        throw new Error("OpenCV not loaded");
    }

    const cv = (window as any).cv;
    const src = cv.imread(imageSource);
    const gray = new cv.Mat();
    const blurred = new cv.Mat();
    const edges = new cv.Mat();
    const srcClone = src.clone();

    let result = null;

    try {
        // 1. Preprocessing
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

        // Pass 1: Standard Canny
        console.log("[Auto-Crop] Pass 1: Standard Canny");
        cv.Canny(blurred, edges, 75, 200);
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
        result = findQuad(cv, contours, 5000);
        contours.delete(); hierarchy.delete();

        // Pass 2: Otsu Thresholding
        if (!result) {
            console.log("[Auto-Crop] Pass 2: Otsu Thresholding");
            cv.threshold(gray, edges, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
            contours = new cv.MatVector(); hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
            result = findQuad(cv, contours, 5000);
            contours.delete(); hierarchy.delete();
        }

        // Pass 3: Softer Canny
        if (!result) {
            console.log("[Auto-Crop] Pass 3: Softer Canny");
            cv.Canny(blurred, edges, 50, 150);
            contours = new cv.MatVector(); hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
            result = findQuad(cv, contours, 5000);
            contours.delete(); hierarchy.delete();
        }

        // Pass 4: Adaptive Threshold
        if (!result) {
            console.log("[Auto-Crop] Pass 4: Adaptive Threshold");
            cv.adaptiveThreshold(gray, edges, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
            contours = new cv.MatVector(); hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
            result = findQuad(cv, contours, 5000);
            contours.delete(); hierarchy.delete();
        }

    } catch (e) {
        console.error("OpenCV detection error:", e);
    } finally {
        try {
            if (src && !src.isDeleted()) src.delete();
            if (srcClone && !srcClone.isDeleted()) srcClone.delete();
            if (gray && !gray.isDeleted()) gray.delete();
            if (blurred && !blurred.isDeleted()) blurred.delete();
            if (edges && !edges.isDeleted()) edges.delete();
        } catch (cleanupErr) {
            console.warn("Cleanup error", cleanupErr);
        }
    }

    return result;
};

/**
 * Internal helper to find quad in contours
 */
function findQuad(cv: any, contours: any, minArea: number): { x: number, y: number }[] | null {
    let maxArea = 0;
    let maxContourCoords: { x: number, y: number }[] | null = null;

    for (let i = 0; i < contours.size(); ++i) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);

        if (area > minArea) {
            const peri = cv.arcLength(cnt, true);
            const approx = new cv.Mat();
            // Try slightly looser epsilon for approximation
            cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

            if (approx.rows === 4 && area > maxArea) {
                maxArea = area;
                maxContourCoords = [];
                for (let j = 0; j < 4; j++) {
                    maxContourCoords.push({
                        x: approx.data32S[j * 2],
                        y: approx.data32S[j * 2 + 1]
                    });
                }
            } else if (approx.rows > 4) {
                // Fallback: If close to 4 points (e.g. 5 or 6), maybe it's the right shape but noisy?
                // We can check bounding rect or minAreaRect?
                // For now, strict to 4 works best for dewarping.
            }
            approx.delete();
        }
    }
    return maxContourCoords;
}

/**
 * Warps the perspective of the image to strictly fit the ID card aspect ratio.
 */
export const warpPerspective = async (imageSource: HTMLImageElement | HTMLCanvasElement, points: { x: number, y: number }[]): Promise<string | null> => {
    if (!isOpenCVLoaded) return null;
    const cv = (window as any).cv;

    const src = cv.imread(imageSource);
    const dst = new cv.Mat();

    let resultUrl = null;

    try {
        // Sort points: TL, TR, BR, BL order (Standard for OpenCV usually)
        // First, sort by 'y' => top 2 and bottom 2
        points.sort((a, b) => a.y - b.y);
        const top = points.slice(0, 2).sort((a, b) => a.x - b.x); // TL, TR
        const bottom = points.slice(2, 4).sort((a, b) => a.x - b.x); // BL, BR

        // But! bottom sorted by x means: [BL, BR]
        // Order needed for perspectiveTransform: TL, TR, BR, BL? Or TL, TR, BL, BR?
        // Let's create our Dest points in specific order and match source to it.

        // Let's use: TopLeft, TopRight, BottomRight, BottomLeft
        const tl = top[0];
        const tr = top[1];
        const bl = bottom[0];
        const br = bottom[1];

        // Expand the points slightly to avoid cutting off edges (add padding)
        // Calculate centroid
        const cx = (tl.x + tr.x + bl.x + br.x) / 4;
        const cy = (tl.y + tr.y + bl.y + br.y) / 4;

        // Expansion factor (e.g., 1.02 for 2% padding)
        const scale = 1.025;

        const expand = (p: { x: number, y: number }) => ({
            x: cx + (p.x - cx) * scale,
            y: cy + (p.y - cy) * scale
        });

        const tl_e = expand(tl);
        const tr_e = expand(tr);
        const br_e = expand(br);
        const bl_e = expand(bl);

        const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
            tl_e.x, tl_e.y,
            tr_e.x, tr_e.y,
            br_e.x, br_e.y,
            bl_e.x, bl_e.y
        ]);

        // Standard aspect ratio
        const targetWidth = 1000;
        const targetHeight = Math.round(targetWidth / 1.585);

        const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,
            targetWidth, 0,
            targetWidth, targetHeight,
            0, targetHeight
        ]);

        const M = cv.getPerspectiveTransform(srcTri, dstTri);
        cv.warpPerspective(src, dst, M, new cv.Size(targetWidth, targetHeight), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        const canvas = document.createElement('canvas');
        cv.imshow(canvas, dst);
        resultUrl = canvas.toDataURL('image/jpeg');

        srcTri.delete();
        dstTri.delete();
        M.delete();
    } catch (e) {
        console.error("Warp error:", e);
    } finally {
        if (src && !src.isDeleted()) src.delete();
        if (dst && !dst.isDeleted()) dst.delete();
    }

    return resultUrl;
};
