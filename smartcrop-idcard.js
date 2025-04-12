/**
 * Smart ID Card Detector
 * 使用 smartcrop.js 和 OpenCV.js 实现更精确的身份证自动识别和裁剪功能
 */

class SmartIDCardDetector {
    constructor() {
        this.isOpenCVReady = false;
        this.isSmartcropReady = false;
        this.loadDependencies();
    }

    /**
     * 加载所需的依赖库
     */
    async loadDependencies() {
        await Promise.all([
            this.loadOpenCV(),
            this.loadSmartcrop()
        ]);
    }

    /**
     * 加载 OpenCV.js 库
     */
    loadOpenCV() {
        return new Promise((resolve, reject) => {
            // 如果 OpenCV 已经加载，直接返回
            if (window.cv) {
                this.isOpenCVReady = true;
                console.log('OpenCV.js 已加载');
                resolve();
                return;
            }

            // 创建 script 标签加载 OpenCV.js
            const script = document.createElement('script');
            script.setAttribute('async', '');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', 'https://docs.opencv.org/4.7.0/opencv.js');
            
            // 加载成功回调
            script.onload = () => {
                console.log('OpenCV.js 加载成功');
                this.isOpenCVReady = true;
                resolve();
            };
            
            // 加载失败回调
            script.onerror = (err) => {
                console.error('OpenCV.js 加载失败：', err);
                reject(new Error('OpenCV.js 加载失败'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * 加载 smartcrop.js 库
     */
    loadSmartcrop() {
        return new Promise((resolve, reject) => {
            // 如果 smartcrop 已经加载，直接返回
            if (window.smartcrop) {
                this.isSmartcropReady = true;
                console.log('smartcrop.js 已加载');
                resolve();
                return;
            }

            // 创建 script 标签加载 smartcrop.js
            const script = document.createElement('script');
            script.setAttribute('async', '');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', 'https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.min.js');
            
            // 加载成功回调
            script.onload = () => {
                console.log('smartcrop.js 加载成功');
                this.isSmartcropReady = true;
                resolve();
            };
            
            // 加载失败回调
            script.onerror = (err) => {
                console.error('smartcrop.js 加载失败：', err);
                reject(new Error('smartcrop.js 加载失败'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * 等待依赖库加载完成
     */
    async waitForDependencies() {
        if (!this.isOpenCVReady || !this.isSmartcropReady) {
            try {
                await this.loadDependencies();
            } catch (error) {
                console.error('等待依赖库加载失败：', error);
                throw error;
            }
        }
    }

    /**
     * 从图像 URL 创建 OpenCV Mat 对象
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @returns {Promise<cv.Mat>} - OpenCV Mat 对象
     */
    async imageUrlToMat(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    // 创建 Canvas 元素
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    
                    // 从 Canvas 创建 OpenCV Mat
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const mat = cv.matFromImageData(imgData);
                    resolve(mat);
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = (error) => {
                reject(error);
            };
            img.src = imageUrl;
        });
    }

    /**
     * 将 OpenCV Mat 转换为图像 URL
     * @param {cv.Mat} mat - OpenCV Mat 对象
     * @returns {string} - 图像的 Base64 URL
     */
    matToImageUrl(mat) {
        const canvas = document.createElement('canvas');
        canvas.width = mat.cols;
        canvas.height = mat.rows;
        const ctx = canvas.getContext('2d');
        const imgData = new ImageData(
            new Uint8ClampedArray(mat.data),
            mat.cols,
            mat.rows
        );
        ctx.putImageData(imgData, 0, 0);
        return canvas.toDataURL('image/jpeg');
    }

    /**
     * 使用 smartcrop.js 智能裁剪图像
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @returns {Promise<Object>} - 裁剪结果
     */
    async smartCropImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    // 身份证的标准宽高比约为 1.58:1
                    const aspectRatio = 1.58;
                    const width = img.width;
                    const height = width / aspectRatio;
                    
                    // 使用 smartcrop.js 进行智能裁剪
                    smartcrop.crop(img, { width, height, minScale: 0.8 }).then(result => {
                        resolve(result);
                    }).catch(err => {
                        reject(err);
                    });
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = (error) => {
                reject(error);
            };
            img.src = imageUrl;
        });
    }

    /**
     * 应用 smartcrop.js 的裁剪结果到图像
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @param {Object} cropResult - smartcrop.js 的裁剪结果
     * @returns {string} - 裁剪后的图像 URL
     */
    applyCrop(imageUrl, cropResult) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const crop = cropResult.topCrop;
                    const canvas = document.createElement('canvas');
                    canvas.width = crop.width;
                    canvas.height = crop.height;
                    const ctx = canvas.getContext('2d');
                    
                    ctx.drawImage(
                        img,
                        crop.x, crop.y, crop.width, crop.height,
                        0, 0, crop.width, crop.height
                    );
                    
                    resolve(canvas.toDataURL('image/jpeg'));
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = (error) => {
                reject(error);
            };
            img.src = imageUrl;
        });
    }

    /**
     * 使用 OpenCV.js 进行边缘检测和矩形检测
     * @param {cv.Mat} srcMat - 源图像的 Mat 对象
     * @returns {Object} - 检测到的最佳矩形区域
     */
    detectRectangle(srcMat) {
        // 创建用于处理的 Mat
        let grayMat = new cv.Mat();
        let blurredMat = new cv.Mat();
        let cannyMat = new cv.Mat();
        let dilatedMat = new cv.Mat();
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        
        try {
            // 转换为灰度图
            cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
            
            // 应用高斯模糊减少噪声
            cv.GaussianBlur(grayMat, blurredMat, new cv.Size(5, 5), 0);
            
            // 应用 Canny 边缘检测
            cv.Canny(blurredMat, cannyMat, 50, 150);
            
            // 应用膨胀操作连接断开的边缘
            const dilationSize = new cv.Size(3, 3);
            const dilationElement = cv.getStructuringElement(cv.MORPH_RECT, dilationSize);
            cv.dilate(cannyMat, dilatedMat, dilationElement);
            
            // 查找轮廓
            cv.findContours(dilatedMat, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
            
            // 查找最合适的矩形轮廓
            let bestRect = null;
            let maxScore = 0;
            
            // 获取图像面积
            const imgArea = srcMat.rows * srcMat.cols;
            
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                // 忽略太小或太大的轮廓
                if (area < imgArea * 0.1 || area > imgArea * 0.9) {
                    continue;
                }
                
                // 计算轮廓的周长
                const perimeter = cv.arcLength(contour, true);
                
                // 近似轮廓为多边形
                const approx = new cv.Mat();
                cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
                
                // 如果是四边形，可能是身份证
                if (approx.rows === 4) {
                    // 计算矩形度
                    const rect = cv.boundingRect(contour);
                    const rectArea = rect.width * rect.height;
                    const rectangularity = area / rectArea;
                    
                    // 计算长宽比（身份证的长宽比约为 1.58:1）
                    const aspectRatio = rect.width / rect.height;
                    const idealAspectRatio = 1.58;
                    const aspectRatioScore = 1 - Math.min(Math.abs(aspectRatio - idealAspectRatio) / idealAspectRatio, 0.5);
                    
                    // 综合评分
                    const score = rectangularity * 0.6 + aspectRatioScore * 0.4;
                    
                    if (score > maxScore) {
                        maxScore = score;
                        bestRect = rect;
                    }
                }
                
                approx.delete();
            }
            
            return bestRect;
        } finally {
            // 释放资源
            grayMat.delete();
            blurredMat.delete();
            cannyMat.delete();
            dilatedMat.delete();
            contours.delete();
            hierarchy.delete();
        }
    }

    /**
     * 使用 HED (Holistically-Nested Edge Detection) 进行边缘检测
     * 这是一个模拟实现，实际项目中可以集成 TensorFlow.js 和预训练的 HED 模型
     * @param {cv.Mat} srcMat - 源图像的 Mat 对象
     * @returns {cv.Mat} - 边缘检测结果
     */
    simulateHEDEdgeDetection(srcMat) {
        // 创建用于处理的 Mat
        let grayMat = new cv.Mat();
        let edgeMat = new cv.Mat();
        
        try {
            // 转换为灰度图
            cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
            
            // 使用 Canny 边缘检测模拟 HED
            // 在实际项目中，这里应该使用 TensorFlow.js 加载预训练的 HED 模型
            cv.Canny(grayMat, edgeMat, 30, 100);
            
            return edgeMat.clone();
        } finally {
            // 释放资源
            grayMat.delete();
            edgeMat.delete();
        }
    }

    /**
     * 检测并提取图像中的身份证
     * 结合 smartcrop.js 和 OpenCV.js 的优势
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @returns {Promise<string>} - 提取出的身份证图像的 Base64 URL
     */
    async detectIDCard(imageUrl) {
        try {
            // 等待依赖库加载完成
            await this.waitForDependencies();
            
            // 第一步：使用 smartcrop.js 进行初步裁剪
            const cropResult = await this.smartCropImage(imageUrl);
            const croppedImageUrl = await this.applyCrop(imageUrl, cropResult);
            
            // 第二步：使用 OpenCV.js 进行精确矩形检测
            const srcMat = await this.imageUrlToMat(croppedImageUrl);
            const rect = this.detectRectangle(srcMat);
            
            let resultImageUrl;
            
            if (rect) {
                // 如果检测到矩形，裁剪出矩形区域
                let rectMat = srcMat.roi(rect);
                resultImageUrl = this.matToImageUrl(rectMat);
                rectMat.delete();
            } else {
                // 如果未检测到矩形，使用 smartcrop 的结果
                resultImageUrl = croppedImageUrl;
            }
            
            // 释放资源
            srcMat.delete();
            
            return resultImageUrl;
        } catch (error) {
            console.error('身份证检测失败：', error);
            // 出错时返回原始图像
            return imageUrl;
        }
    }
}