/**
 * TensorFlow ID Card Detector
 * 使用 TensorFlow.js 和 OpenCV.js 实现更精确的身份证自动识别和裁剪功能
 */

class TensorFlowIDCardDetector {
    constructor() {
        this.isOpenCVReady = false;
        this.isTensorFlowReady = false;
        this.model = null;
        this.loadDependencies();
    }

    /**
     * 加载所需的依赖库
     */
    async loadDependencies() {
        await Promise.all([
            this.loadOpenCV(),
            this.loadTensorFlow()
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
     * 加载 TensorFlow.js 库
     */
    loadTensorFlow() {
        return new Promise((resolve, reject) => {
            // 如果 TensorFlow 已经加载，直接返回
            if (window.tf) {
                this.isTensorFlowReady = true;
                console.log('TensorFlow.js 已加载');
                this.loadModel().then(resolve).catch(reject);
                return;
            }

            // 创建 script 标签加载 TensorFlow.js
            const script = document.createElement('script');
            script.setAttribute('async', '');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js');
            
            // 加载成功回调
            script.onload = () => {
                console.log('TensorFlow.js 加载成功');
                this.isTensorFlowReady = true;
                this.loadModel().then(resolve).catch(reject);
            };
            
            // 加载失败回调
            script.onerror = (err) => {
                console.error('TensorFlow.js 加载失败：', err);
                reject(new Error('TensorFlow.js 加载失败'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * 加载预训练的边缘检测模型
     * 注意：这里使用的是 BlazeFace 模型作为示例
     * 实际应用中可以使用专门的身份证检测模型
     */
    async loadModel() {
        try {
            // 加载 BlazeFace 模型
            const blazefaceScript = document.createElement('script');
            blazefaceScript.setAttribute('async', '');
            blazefaceScript.setAttribute('type', 'text/javascript');
            blazefaceScript.setAttribute('src', 'https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js');
            
            await new Promise((resolve, reject) => {
                blazefaceScript.onload = resolve;
                blazefaceScript.onerror = reject;
                document.head.appendChild(blazefaceScript);
            });
            
            // 初始化模型
            this.model = await blazeface.load();
            console.log('模型加载成功');
        } catch (error) {
            console.error('模型加载失败：', error);
            throw error;
        }
    }

    /**
     * 等待依赖库加载完成
     */
    async waitForDependencies() {
        if (!this.isOpenCVReady || !this.isTensorFlowReady || !this.model) {
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
     * 使用 TensorFlow.js 进行对象检测
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @returns {Promise<Object>} - 检测结果
     */
    async detectObjects(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
                try {
                    // 使用模型进行预测
                    const predictions = await this.model.estimateFaces(img, false);
                    resolve({ img, predictions });
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
            cv.Canny(blurredMat, cannyMat, 30, 100);
            
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
                if (approx.rows >= 4 && approx.rows <= 6) {
                    // 计算矩形度
                    const rect = cv.boundingRect(contour);
                    const rectArea = rect.width * rect.height;
                    const rectangularity = area / rectArea;
                    
                    // 计算长宽比（身份证的长宽比约为 1.58:1）
                    const aspectRatio = rect.width / rect.height;
                    const idealAspectRatio = 1.58;
                    const aspectRatioScore = 1 - Math.min(Math.abs(aspectRatio - idealAspectRatio) / idealAspectRatio, 0.5);
                    
                    // 综合评分
                    const score = rectangularity * 0.5 + aspectRatioScore * 0.5;
                    
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
     * 使用自适应阈值增强图像
     * @param {cv.Mat} srcMat - 源图像的 Mat 对象
     * @returns {cv.Mat} - 增强后的图像
     */
    enhanceImage(srcMat) {
        let grayMat = new cv.Mat();
        let enhancedMat = new cv.Mat();
        
        try {
            // 转换为灰度图
            cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
            
            // 应用自适应阈值增强对比度
            cv.adaptiveThreshold(grayMat, enhancedMat, 255, 
                                cv.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                cv.THRESH_BINARY, 11, 2);
            
            // 转换回彩色图像
            let resultMat = new cv.Mat();
            cv.cvtColor(enhancedMat, resultMat, cv.COLOR_GRAY2RGBA);
            
            return resultMat;
        } finally {
            grayMat.delete();
            enhancedMat.delete();
        }
    }

    /**
     * 检测并提取图像中的身份证
     * 结合 TensorFlow.js 和 OpenCV.js 的优势
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @returns {Promise<string>} - 提取出的身份证图像的 Base64 URL
     */
    async detectIDCard(imageUrl) {
        try {
            // 等待依赖库加载完成
            await this.waitForDependencies();
            
            // 第一步：使用 TensorFlow.js 进行对象检测
            const { img, predictions } = await this.detectObjects(imageUrl);
            
            // 第二步：使用 OpenCV.js 进行精确矩形检测
            const srcMat = await this.imageUrlToMat(imageUrl);
            
            let resultImageUrl;
            
            // 如果检测到人脸，可能是身份证照片区域
            if (predictions && predictions.length > 0) {
                // 扩展人脸区域以包含整个身份证
                const prediction = predictions[0];
                const faceBox = prediction.topLeft[0];
                const faceWidth = prediction.bottomRight[0] - prediction.topLeft[0];
                const faceHeight = prediction.bottomRight[1] - prediction.topLeft[1];
                
                // 身份证宽度约为人脸宽度的 4 倍，高度约为人脸高度的 3 倍
                const cardWidth = faceWidth * 4;
                const cardHeight = cardWidth / 1.58; // 使用身份证标准比例
                
                // 计算身份证可能的位置（以人脸为中心）
                const cardX = Math.max(0, faceBox[0] - (cardWidth - faceWidth) / 2);
                const cardY = Math.max(0, faceBox[1] - (cardHeight - faceHeight) / 3);
                
                // 创建矩形区域
                const rect = new cv.Rect(
                    Math.floor(cardX),
                    Math.floor(cardY),
                    Math.min(Math.floor(cardWidth), srcMat.cols - Math.floor(cardX)),
                    Math.min(Math.floor(cardHeight), srcMat.rows - Math.floor(cardY))
                );
                
                // 裁剪出矩形区域
                let rectMat = srcMat.roi(rect);
                resultImageUrl = this.matToImageUrl(rectMat);
                rectMat.delete();
            } else {
                // 如果未检测到人脸，使用传统的矩形检测
                const rect = this.detectRectangle(srcMat);
                
                if (rect) {
                    // 如果检测到矩形，裁剪出矩形区域
                    let rectMat = srcMat.roi(rect);
                    resultImageUrl = this.matToImageUrl(rectMat);
                    rectMat.delete();
                } else {
                    // 如果未检测到矩形，应用图像增强
                    console.log('未检测到合适的身份证轮廓，应用基本图像增强');
                    let enhancedMat = this.enhanceImage(srcMat);
                    resultImageUrl = this.matToImageUrl(enhancedMat);
                    enhancedMat.delete();
                }
            }
            
            // 创建透明背景的图像
            if (resultImageUrl) {
                // 重新获取 Mat 以处理透明背景
                const transparentSrcMat = await this.imageUrlToMat(resultImageUrl);
                
                // 创建掩码 - 使用矩形区域作为掩码
                let maskMat = new cv.Mat.zeros(transparentSrcMat.rows, transparentSrcMat.cols, cv.CV_8UC1);
                
                // 使用更精确的轮廓检测来创建掩码
                let grayMat = new cv.Mat();
                let threshMat = new cv.Mat();
                let contours = new cv.MatVector();
                let hierarchy = new cv.Mat();
                
                // 转换为灰度
                cv.cvtColor(transparentSrcMat, grayMat, cv.COLOR_RGBA2GRAY);
                
                // 应用高斯模糊减少噪声
                let blurMat = new cv.Mat();
                cv.GaussianBlur(grayMat, blurMat, new cv.Size(5, 5), 0);
                
                // 应用 Canny 边缘检测
                let cannyMat = new cv.Mat();
                cv.Canny(blurMat, cannyMat, 30, 100);
                
                // 应用膨胀操作连接断开的边缘
                let dilatedMat = new cv.Mat();
                const dilationSize = new cv.Size(3, 3);
                const dilationElement = cv.getStructuringElement(cv.MORPH_RECT, dilationSize);
                cv.dilate(cannyMat, dilatedMat, dilationElement);
                
                // 应用自适应阈值
                cv.adaptiveThreshold(grayMat, threshMat, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
                
                // 合并边缘检测和阈值结果
                let combinedMat = new cv.Mat();
                cv.bitwise_or(dilatedMat, threshMat, combinedMat);
                
                // 应用闭操作填充轮廓内的空隙
                let closingElement = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(9, 9));
                let closedMat = new cv.Mat();
                cv.morphologyEx(combinedMat, closedMat, cv.MORPH_CLOSE, closingElement);
                
                // 查找轮廓
                cv.findContours(closedMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                
                // 找到最大的轮廓
                let maxArea = 0;
                let maxContourIndex = -1;
                
                for (let i = 0; i < contours.size(); i++) {
                    const area = cv.contourArea(contours.get(i));
                    if (area > maxArea) {
                        maxArea = area;
                        maxContourIndex = i;
                    }
                }
                
                // 如果找到轮廓，填充掩码
                if (maxContourIndex !== -1) {
                    // 获取最大轮廓
                    const contour = contours.get(maxContourIndex);
                    
                    // 计算轮廓的周长
                    const perimeter = cv.arcLength(contour, true);
                    
                    // 近似轮廓为多边形，使边缘更平滑
                    const approx = new cv.Mat();
                    cv.approxPolyDP(contour, approx, 0.01 * perimeter, true);
                    
                    // 创建一个新的轮廓向量
                    const smoothContour = new cv.MatVector();
                    smoothContour.push_back(approx);
                    
                    // 填充平滑后的轮廓
                    cv.drawContours(maskMat, smoothContour, 0, new cv.Scalar(255), cv.FILLED);
                    
                    // 应用形态学闭操作，使边缘更平滑
                    const morphElement = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(5, 5));
                    let tempMask = new cv.Mat();
                    cv.morphologyEx(maskMat, tempMask, cv.MORPH_CLOSE, morphElement);
                    tempMask.copyTo(maskMat);
                    
                    // 释放资源
                    approx.delete();
                    smoothContour.delete();
                    tempMask.delete();
                    morphElement.delete();
                } else {
                    // 如果没有找到合适的轮廓，使用矩形作为掩码
                    const rectPoints = new cv.Mat(4, 1, cv.CV_32SC2);
                    rectPoints.data32S[0] = 0;                           rectPoints.data32S[1] = 0;
                    rectPoints.data32S[2] = transparentSrcMat.cols;      rectPoints.data32S[3] = 0;
                    rectPoints.data32S[4] = transparentSrcMat.cols;      rectPoints.data32S[5] = transparentSrcMat.rows;
                    rectPoints.data32S[6] = 0;                           rectPoints.data32S[7] = transparentSrcMat.rows;
                    
                    const rectContour = new cv.MatVector();
                    rectContour.push_back(rectPoints);
                    
                    cv.fillPoly(maskMat, rectContour, new cv.Scalar(255));
                    
                    rectPoints.delete();
                    rectContour.delete();
                }
                
                // 创建透明背景的 RGBA 图像
                let resultMat = new cv.Mat();
                cv.cvtColor(transparentSrcMat, resultMat, cv.COLOR_RGBA2BGRA);
                
                let channels = new cv.MatVector();
                cv.split(resultMat, channels);
                
                // 设置 Alpha 通道为掩码
                channels.set(3, maskMat);
                
                // 合并通道
                cv.merge(channels, resultMat);
                
                // 更新结果图像 URL
                resultImageUrl = this.matToImageUrl(resultMat);
                
                // 释放资源
                transparentSrcMat.delete();
                maskMat.delete();
                grayMat.delete();
                blurMat.delete();
                cannyMat.delete();
                dilatedMat.delete();
                threshMat.delete();
                combinedMat.delete();
                closedMat.delete();
                contours.delete();
                hierarchy.delete();
                channels.delete();
                resultMat.delete();
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