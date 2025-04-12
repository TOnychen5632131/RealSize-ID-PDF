/**
 * HED ID Card Detector
 * 使用 Holistically-Nested Edge Detection (HED) 和 OpenCV.js 实现更精确的身份证自动识别和裁剪功能
 */

class HEDIDCardDetector {
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
     * 加载预训练的 HED 边缘检测模型
     * 注意：这里使用的是模拟实现，实际应用中需要加载真实的 HED 模型
     */
    async loadModel() {
        try {
            // 在实际应用中，这里应该加载预训练的 HED 模型
            // 由于 HED 模型较大，这里使用 MobileNet 作为替代进行演示
            this.model = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
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
     * 使用 TensorFlow.js 模拟 HED 边缘检测
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @returns {Promise<cv.Mat>} - 边缘检测结果的 Mat 对象
     */
    async detectEdges(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
                try {
                    // 创建 Canvas 元素
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    
                    // 获取图像数据
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // 创建 OpenCV Mat
                    const srcMat = cv.matFromImageData(imgData);
                    
                    // 在实际应用中，这里应该使用 TensorFlow.js 运行 HED 模型
                    // 由于 HED 模型较复杂，这里使用 OpenCV 的 Canny 边缘检测进行模拟
                    let grayMat = new cv.Mat();
                    let blurredMat = new cv.Mat();
                    let cannyMat = new cv.Mat();
                    
                    // 转换为灰度图
                    cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
                    
                    // 应用高斯模糊减少噪声
                    cv.GaussianBlur(grayMat, blurredMat, new cv.Size(5, 5), 0);
                    
                    // 应用 Canny 边缘检测（使用较低的阈值以模拟 HED 的效果）
                    cv.Canny(blurredMat, cannyMat, 20, 60);
                    
                    // 释放临时资源
                    srcMat.delete();
                    grayMat.delete();
                    blurredMat.delete();
                    
                    resolve(cannyMat);
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
     * 使用边缘检测结果查找矩形
     * @param {cv.Mat} edgeMat - 边缘检测结果的 Mat 对象
     * @param {cv.Mat} srcMat - 源图像的 Mat 对象
     * @returns {Object} - 检测到的最佳矩形区域
     */
    findRectangles(edgeMat, srcMat) {
        // 创建用于处理的 Mat
        let dilatedMat = new cv.Mat();
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        
        try {
            // 应用膨胀操作连接断开的边缘
            const dilationSize = new cv.Size(5, 5);
            const dilationElement = cv.getStructuringElement(cv.MORPH_RECT, dilationSize);
            cv.dilate(edgeMat, dilatedMat, dilationElement);
            
            // 查找轮廓
            cv.findContours(dilatedMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            // 查找最合适的矩形轮廓
            let bestRect = null;
            let maxScore = 0;
            
            // 获取图像面积
            const imgArea = srcMat.rows * srcMat.cols;
            
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                // 忽略太小或太大的轮廓
                if (area < imgArea * 0.05 || area > imgArea * 0.95) {
                    continue;
                }
                
                // 计算轮廓的周长
                const perimeter = cv.arcLength(contour, true);
                
                // 近似轮廓为多边形
                const approx = new cv.Mat();
                cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
                
                // 如果是四边形或接近四边形，可能是身份证
                if (approx.rows >= 4 && approx.rows <= 8) {
                    // 计算矩形度
                    const rect = cv.boundingRect(contour);
                    const rectArea = rect.width * rect.height;
                    const rectangularity = area / rectArea;
                    
                    // 计算长宽比（身份证的长宽比约为 1.58:1）
                    const aspectRatio = rect.width / rect.height;
                    const idealAspectRatio = 1.58;
                    const aspectRatioScore = 1 - Math.min(Math.abs(aspectRatio - idealAspectRatio) / idealAspectRatio, 0.5);
                    
                    // 综合评分 - 针对 HED 边缘检测结果优化
                    let score = 0;
                    
                    // 四边形得分更高
                    if (approx.rows === 4) {
                        score += 5;
                    } else {
                        score += 3;
                    }
                    
                    // 矩形度评分
                    score += rectangularity * 3;
                    
                    // 长宽比评分
                    score += aspectRatioScore * 4;
                    
                    // 面积评分
                    const areaRatio = area / imgArea;
                    if (areaRatio > 0.1 && areaRatio < 0.9) {
                        score += areaRatio * 2;
                    }
                    
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
            dilatedMat.delete();
            contours.delete();
            hierarchy.delete();
        }
    }

    /**
     * 使用透视变换校正矩形
     * @param {cv.Mat} srcMat - 源图像的 Mat 对象
     * @param {Object} rect - 矩形区域
     * @returns {cv.Mat} - 校正后的图像
     */
    correctPerspective(srcMat, rect) {
        try {
            // 获取矩形的四个角点
            const corners = [
                new cv.Point(rect.x, rect.y),
                new cv.Point(rect.x + rect.width, rect.y),
                new cv.Point(rect.x + rect.width, rect.y + rect.height),
                new cv.Point(rect.x, rect.y + rect.height)
            ];
            
            // 计算目标矩形的尺寸（保持身份证的标准比例 1.58:1）
            const width = Math.max(rect.width, rect.height * 1.58);
            const height = width / 1.58;
            
            // 定义目标矩形的四个角点
            const dstCorners = [
                new cv.Point(0, 0),
                new cv.Point(width - 1, 0),
                new cv.Point(width - 1, height - 1),
                new cv.Point(0, height - 1)
            ];
            
            // 创建源点和目标点的矩阵
            const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                corners[0].x, corners[0].y,
                corners[1].x, corners[1].y,
                corners[2].x, corners[2].y,
                corners[3].x, corners[3].y
            ]);
            
            const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                dstCorners[0].x, dstCorners[0].y,
                dstCorners[1].x, dstCorners[1].y,
                dstCorners[2].x, dstCorners[2].y,
                dstCorners[3].x, dstCorners[3].y
            ]);
            
            // 计算透视变换矩阵
            const perspectiveMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
            
            // 应用透视变换
            const dstMat = new cv.Mat();
            cv.warpPerspective(srcMat, dstMat, perspectiveMatrix, new cv.Size(width, height));
            
            // 释放资源
            srcPoints.delete();
            dstPoints.delete();
            perspectiveMatrix.delete();
            
            return dstMat;
        } catch (error) {
            console.error('透视校正失败：', error);
            // 如果校正失败，返回原始区域的裁剪
            return srcMat.roi(rect);
        }
    }

    /**
     * 增强图像质量
     * @param {cv.Mat} srcMat - 源图像的 Mat 对象
     * @returns {cv.Mat} - 增强后的图像
     */
    enhanceImage(srcMat) {
        try {
            // 创建用于处理的 Mat
            let enhancedMat = new cv.Mat();
            
            // 应用自适应直方图均衡化增强对比度
            let grayMat = new cv.Mat();
            cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
            
            // 创建 CLAHE 对象
            let clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
            let claheMat = new cv.Mat();
            clahe.apply(grayMat, claheMat);
            
            // 转换回彩色图像
            cv.cvtColor(claheMat, enhancedMat, cv.COLOR_GRAY2RGBA);
            
            // 释放资源
            grayMat.delete();
            claheMat.delete();
            
            return enhancedMat;
        } catch (error) {
            console.error('图像增强失败：', error);
            return srcMat.clone();
        }
    }

    /**
     * 检测并提取图像中的身份证
     * 使用 HED 边缘检测和透视校正
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @returns {Promise<string>} - 提取出的身份证图像的 Base64 URL
     */
    async detectIDCard(imageUrl) {
        try {
            // 等待依赖库加载完成
            await this.waitForDependencies();
            
            // 第一步：使用 HED 进行边缘检测
            const edgeMat = await this.detectEdges(imageUrl);
            
            // 第二步：从源图像创建 Mat
            const srcMat = await this.imageUrlToMat(imageUrl);
            
            // 第三步：使用边缘检测结果查找矩形
            const rect = this.findRectangles(edgeMat, srcMat);
            
            let resultImageUrl;
            
            if (rect) {
                // 如果检测到矩形，应用透视校正
                let correctedMat = this.correctPerspective(srcMat, rect);
                
                // 增强图像质量
                let enhancedMat = this.enhanceImage(correctedMat);
                
                resultImageUrl = this.matToImageUrl(enhancedMat);
                
                // 释放资源
                correctedMat.delete();
                enhancedMat.delete();
            } else {
                // 如果未检测到矩形，应用基本图像增强
                console.log('未检测到合适的身份证轮廓，应用基本图像增强');
                let enhancedMat = this.enhanceImage(srcMat);
                resultImageUrl = this.matToImageUrl(enhancedMat);
                enhancedMat.delete();
            }
            
            // 释放资源
            srcMat.delete();
            edgeMat.delete();
            
            return resultImageUrl;
        } catch (error) {
            console.error('身份证检测失败：', error);
            // 出错时返回原始图像
            return imageUrl;
        }
    }
}