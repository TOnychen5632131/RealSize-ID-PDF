/**
 * ID Card Detector
 * 使用 OpenCV.js 实现身份证自动识别和裁剪功能
 */

class IDCardDetector {
    constructor() {
        this.isOpenCVReady = false;
        this.loadOpenCV();
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
     * 等待 OpenCV 加载完成
     */
    async waitForOpenCV() {
        if (!this.isOpenCVReady) {
            try {
                await this.loadOpenCV();
            } catch (error) {
                console.error('等待 OpenCV 加载失败：', error);
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
     * 检测并提取图像中的身份证
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @returns {Promise<string>} - 提取出的身份证图像的 Base64 URL
     */
    async detectIDCard(imageUrl) {
        try {
            await this.waitForOpenCV();
            
            // 将图像 URL 转换为 Mat
            const srcMat = await this.imageUrlToMat(imageUrl);
            
            // 创建用于处理的 Mat
            let grayMat = new cv.Mat();
            let blurredMat = new cv.Mat();
            let cannyMat = new cv.Mat();
            let dilatedMat = new cv.Mat();
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            let hsvMat = new cv.Mat();
            let maskMat = new cv.Mat();
            let resultMat = new cv.Mat();
            
            try {
                // 转换为灰度图
                cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
                
                // 应用自适应阈值增强对比度
                let thresholdMat = new cv.Mat();
                cv.adaptiveThreshold(grayMat, thresholdMat, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
                
                // 应用高斯模糊减少噪声
                cv.GaussianBlur(grayMat, blurredMat, new cv.Size(5, 5), 0);
                
                // 应用增强的 Canny 边缘检测（针对香港身份证优化阈值）
                cv.Canny(blurredMat, cannyMat, 20, 120); // 降低阈值以捕获更多边缘
                
                // 使用更大的结构元素进行膨胀，以更好地连接断开的线条
                const dilationSize = new cv.Size(7, 7); // 增大结构元素尺寸
                const dilationElement = cv.getStructuringElement(cv.MORPH_RECT, dilationSize);
                cv.dilate(cannyMat, dilatedMat, dilationElement);
                
                // 应用额外的形态学操作以增强边缘
                let morphMat = new cv.Mat();
                let morphElement = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
                cv.morphologyEx(dilatedMat, morphMat, cv.MORPH_CLOSE, morphElement);
                cv.morphologyEx(morphMat, dilatedMat, cv.MORPH_OPEN, morphElement);
                morphMat.delete();
                morphElement.delete();
                
                // 尝试使用颜色过滤辅助识别（身份证通常有特定的颜色范围）
                cv.cvtColor(srcMat, hsvMat, cv.COLOR_RGBA2RGB);
                cv.cvtColor(hsvMat, hsvMat, cv.COLOR_RGB2HSV);
                
                // 创建掩码以过滤掉非身份证区域的颜色
                let lowerBound = new cv.Mat(1, 3, cv.CV_8UC1);
                let upperBound = new cv.Mat(1, 3, cv.CV_8UC1);
                
                // 设置 HSV 范围 - 针对香港身份证的特殊颜色特征进行优化
                // 香港身份证通常有浅蓝色/青色背景
                lowerBound.data[0] = 70;  // H 下限 - 青蓝色范围开始
                lowerBound.data[1] = 20;  // S 下限 - 允许低饱和度
                lowerBound.data[2] = 150; // V 下限 - 避免太暗的区域
                
                upperBound.data[0] = 130; // H 上限 - 青蓝色范围结束
                upperBound.data[1] = 255; // S 上限 - 允许高饱和度
                upperBound.data[2] = 255; // V 上限
                
                // 应用颜色过滤
                cv.inRange(hsvMat, lowerBound, upperBound, maskMat);
                
                // 结合边缘检测和颜色过滤的结果
                let combinedMat = new cv.Mat();
                cv.bitwise_or(dilatedMat, maskMat, combinedMat);
                
                // 应用形态学闭操作，填充轮廓内的空隙
                let closingElement = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(9, 9));
                let closedMat = new cv.Mat();
                cv.morphologyEx(combinedMat, closedMat, cv.MORPH_CLOSE, closingElement);
                
                // 查找轮廓 - 使用处理后的图像
                cv.findContours(closedMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                
                // 释放临时 Mat
                thresholdMat.delete();
                combinedMat.delete();
                closedMat.delete();
                closingElement.delete();
                lowerBound.delete();
                upperBound.delete();
                
                // 查找最合适的矩形轮廓（可能是身份证）
                let maxArea = 0;
                let maxContourIndex = -1;
                let bestScore = 0;
                
                // 获取图像面积用于计算相对面积
                const imgArea = srcMat.rows * srcMat.cols;
                
                // 创建可视化调试图像（如果需要）
                let debugMat = srcMat.clone();
                
                for (let i = 0; i < contours.size(); i++) {
                    const contour = contours.get(i);
                    const area = cv.contourArea(contour);
                    
                    // 忽略太小或太大的轮廓 - 调整阈值以适应香港身份证
                    if (area < imgArea * 0.03 || area > imgArea * 0.97) {
                        continue;
                    }
                    
                    // 计算轮廓的周长
                    const perimeter = cv.arcLength(contour, true);
                    
                    // 近似轮廓为多边形 - 使用更精确的参数
                    const approx = new cv.Mat();
                    // 降低 epsilon 值以获得更精确的多边形近似
                    cv.approxPolyDP(contour, approx, 0.008 * perimeter, true);
                    
                    // 计算轮廓的矩形度（矩形度越接近 1，越像矩形）
                    const rect = cv.boundingRect(contour);
                    const rectArea = rect.width * rect.height;
                    const rectangularity = area / rectArea;
                    
                    // 计算长宽比（香港身份证的长宽比约为 1.58:1）
                    const aspectRatio = rect.width / rect.height;
                    const idealAspectRatio = 1.58;
                    const aspectRatioScore = 1 - Math.min(Math.abs(aspectRatio - idealAspectRatio) / idealAspectRatio, 0.4) * 2;
                    
                    // 计算轮廓的凸性 - 身份证应该是凸多边形
                    let hull = new cv.Mat();
                    cv.convexHull(contour, hull);
                    const hullArea = cv.contourArea(hull);
                    const convexityScore = area / hullArea; // 越接近1越好
                    hull.delete();
                    
                    // 综合评分系统 - 针对香港身份证优化
                    let score = 0;
                    
                    // 如果是四边形，加分
                    if (approx.rows === 4) {
                        score += 8; // 增加四边形的权重
                    } else if (approx.rows >= 3 && approx.rows <= 6) {
                        // 3-6个顶点也可能是身份证（考虑检测不完美的情况）
                        score += 3;
                    }
                    
                    // 矩形度评分 - 增加权重
                    score += rectangularity * 5;
                    
                    // 长宽比评分 - 增加权重
                    score += aspectRatioScore * 5;
                    
                    // 凸性评分
                    score += convexityScore * 3;
                    
                    // 面积评分（优先选择较大的轮廓，但不要太大）
                    const areaRatio = area / imgArea;
                    if (areaRatio > 0.08 && areaRatio < 0.92) {
                        score += areaRatio * 3;
                    }
                    
                    // 更新最佳轮廓
                    if (score > bestScore) {
                        bestScore = score;
                        maxArea = area;
                        maxContourIndex = i;
                    }
                    
                    approx.delete();
                }
                
                // 释放调试图像
                debugMat.delete();
                }
                
                // 如果找到合适的轮廓
                if (maxContourIndex !== -1) {
                    const contour = contours.get(maxContourIndex);
                    
                    // 获取轮廓的角点
                    const approx = new cv.Mat();
                    const perimeter = cv.arcLength(contour, true);
                    cv.approxPolyDP(contour, approx, 0.01 * perimeter, true);
                    
                    // 处理角点数量不是 4 的情况
                    let cornerPoints;
                    if (approx.rows === 4) {
                        // 直接使用四个角点
                        cornerPoints = approx;
                    } else {
                        // 如果角点不是 4 个，使用最小外接矩形
                        const rect = cv.minAreaRect(contour);
                        cornerPoints = new cv.Mat();
                        cv.boxPoints(rect, cornerPoints);
                    }
                    
                    // 确保我们有四个点
                    if (cornerPoints.rows === 4) {
                        // 对四个点进行排序，以便进行透视变换 - 改进排序算法以提高精确度
                        const points = [];
                        for (let i = 0; i < 4; i++) {
                            points.push({
                                x: cornerPoints.data32F ? cornerPoints.data32F[i * 2] : cornerPoints.data32S[i * 2],
                                y: cornerPoints.data32F ? cornerPoints.data32F[i * 2 + 1] : cornerPoints.data32S[i * 2 + 1]
                            });
                        }
                        
                        // 计算质心
                        const centroid = {
                            x: points.reduce((sum, p) => sum + p.x, 0) / 4,
                            y: points.reduce((sum, p) => sum + p.y, 0) / 4
                        };
                        
                        // 根据点相对于质心的角度进行排序
                        points.forEach(point => {
                            point.angle = Math.atan2(point.y - centroid.y, point.x - centroid.x);
                        });
                        points.sort((a, b) => a.angle - b.angle);
                        
                        // 确保点的顺序是：左上、右上、右下、左下
                        // 找到最上面的点（y 坐标最小）
                        let topIndex = 0;
                        for (let i = 1; i < 4; i++) {
                            if (points[i].y < points[topIndex].y) {
                                topIndex = i;
                            }
                        }
                        
                        // 重新排序，使最上面的点成为第一个点
                        const sortedPoints = [];
                        for (let i = 0; i < 4; i++) {
                            sortedPoints.push(points[(topIndex + i) % 4]);
                        }
                        
                        // 确保点的顺序是顺时针的
                        if ((sortedPoints[1].x - sortedPoints[0].x) * (sortedPoints[2].y - sortedPoints[1].y) -
                            (sortedPoints[1].y - sortedPoints[0].y) * (sortedPoints[2].x - sortedPoints[1].x) < 0) {
                            // 如果不是顺时针，则交换第 2 和第 4 个点
                            [sortedPoints[1], sortedPoints[3]] = [sortedPoints[3], sortedPoints[1]];
                        }
                        
                        // 创建源点和目标点的矩阵
                        const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                            sortedPoints[0].x, sortedPoints[0].y,
                            sortedPoints[1].x, sortedPoints[1].y,
                            sortedPoints[2].x, sortedPoints[2].y,
                            sortedPoints[3].x, sortedPoints[3].y
                        ]);
                        
                        // 计算身份证的宽度和高度（使用标准比例）
                        // 身份证标准比例约为 1.58:1（宽：高）
                        const cardRatio = 1.58;
                        const width = Math.max(
                            Math.hypot(sortedPoints[1].x - sortedPoints[0].x, sortedPoints[1].y - sortedPoints[0].y),
                            Math.hypot(sortedPoints[2].x - sortedPoints[3].x, sortedPoints[2].y - sortedPoints[3].y)
                        );
                        const height = width / cardRatio;
                        
                        // 创建目标点矩阵（矫正后的矩形）
                        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
                            0, 0,
                            width, 0,
                            width, height,
                            0, height
                        ]);
                        
                        // 计算透视变换矩阵
                        const perspectiveMatrix = cv.getPerspectiveTransform(srcPoints, dstPoints);
                        
                        // 应用透视变换
                        const warpedMat = new cv.Mat();
                        cv.warpPerspective(srcMat, warpedMat, perspectiveMatrix, new cv.Size(width, height));
                        
                        // 创建透明背景的图像
                        let transparentMat = new cv.Mat();
                        cv.cvtColor(warpedMat, transparentMat, cv.COLOR_RGBA2BGRA);
                        
                        // 创建掩码 - 使用轮廓提取身份证区域
                        let maskMat = new cv.Mat.zeros(height, width, cv.CV_8UC1);
                        let maskContour = new cv.MatVector();
                        let maskPoints = new cv.Mat(4, 1, cv.CV_32SC2);
                        
                        // 设置掩码的四个角点
                        maskPoints.data32S[0] = 0;              maskPoints.data32S[1] = 0;
                        maskPoints.data32S[2] = width;          maskPoints.data32S[3] = 0;
                        maskPoints.data32S[4] = width;          maskPoints.data32S[5] = height;
                        maskPoints.data32S[6] = 0;              maskPoints.data32S[7] = height;
                        
                        maskContour.push_back(maskPoints);
                        
                        // 填充掩码
                        cv.fillPoly(maskMat, maskContour, new cv.Scalar(255));
                        
                        // 创建透明背景的 RGBA 图像
                        let resultMat = new cv.Mat.zeros(height, width, cv.CV_8UC4);
                        let channels = new cv.MatVector();
                        cv.split(transparentMat, channels);
                        
                        // 设置 Alpha 通道为掩码
                        channels.set(3, maskMat);
                        cv.merge(channels, resultMat);
                        
                        // 释放资源
                        maskMat.delete();
                        maskPoints.delete();
                        maskContour.delete();
                        channels.delete();
                        transparentMat.delete();
                        
                        // 使用带透明背景的结果替换 warpedMat
                        warpedMat.delete();
                        warpedMat = resultMat.clone();
                        resultMat.delete();
                        
                        // 增强处理后的图像 - 多步骤图像增强流程
                        let enhancedMat = new cv.Mat();
                        let tempMat1 = new cv.Mat();
                        let tempMat2 = new cv.Mat();
                        
                        // 步骤 1: 去噪 - 使用双边滤波保留边缘的同时去除噪点
                        cv.cvtColor(warpedMat, tempMat1, cv.COLOR_RGBA2RGB);
                        cv.bilateralFilter(tempMat1, tempMat2, 9, 75, 75);
                        
                        // 步骤 2: 自适应直方图均衡化增强对比度
                        let ycrcbMat = new cv.Mat();
                        cv.cvtColor(tempMat2, ycrcbMat, cv.COLOR_RGB2YCrCb);
                        
                        // 分离通道
                        let channels = new cv.MatVector();
                        cv.split(ycrcbMat, channels);
                        
                        // 对亮度通道进行 CLAHE 处理
                        let clahe = new cv.CLAHE(3.0, new cv.Size(8, 8));
                        clahe.apply(channels.get(0), channels.get(0));
                        
                        // 合并通道
                        cv.merge(channels, ycrcbMat);
                        cv.cvtColor(ycrcbMat, tempMat1, cv.COLOR_YCrCb2RGB);
                        
                        // 步骤 3: 应用锐化滤镜增强细节
                        let kernel = cv.Mat.ones(3, 3, cv.CV_32F);
                        kernel.data32F[4] = 9;  // 增强中心点权重
                        kernel.data32F[0] = -1; kernel.data32F[1] = -1; kernel.data32F[2] = -1;
                        kernel.data32F[3] = -1;                        kernel.data32F[5] = -1;
                        kernel.data32F[6] = -1; kernel.data32F[7] = -1; kernel.data32F[8] = -1;
                        
                        // 归一化内核
                        const kernelSum = 1;
                        for (let i = 0; i < 9; i++) {
                            kernel.data32F[i] /= kernelSum;
                        }
                        
                        cv.filter2D(tempMat1, tempMat2, -1, kernel);
                        
                        // 步骤 4: 调整对比度和亮度
                        cv.convertScaleAbs(tempMat2, enhancedMat, 1.3, 5);
                        
                        // 清理临时资源
                        tempMat1.delete();
                        tempMat2.delete();
                        ycrcbMat.delete();
                        channels.delete();
                        clahe.delete();
                        
                        // 将结果转换为图像 URL
                        const resultImageUrl = this.matToImageUrl(enhancedMat);
                        
                        // 清理额外资源
                        enhancedMat.delete();
                        kernel.delete();
                        
                        // 清理资源
                        approx.delete();
                        if (cornerPoints !== approx) {
                            cornerPoints.delete();
                        }
                        srcPoints.delete();
                        dstPoints.delete();
                        perspectiveMatrix.delete();
                        warpedMat.delete();
                        
                        return resultImageUrl;
                    }
                    
                    approx.delete();
                }
                
                // 如果没有找到合适的轮廓，尝试进行基本的图像增强处理
                console.log('未检测到合适的身份证轮廓，应用基本图像增强');
                
                // 创建增强图像
                let enhancedMat = new cv.Mat();
                let tempMat = new cv.Mat();
                
                try {
                    // 转换为 RGB
                    cv.cvtColor(srcMat, tempMat, cv.COLOR_RGBA2RGB);
                    
                    // 应用基本的图像增强
                    // 1. 自适应直方图均衡化
                    let ycrcbMat = new cv.Mat();
                    cv.cvtColor(tempMat, ycrcbMat, cv.COLOR_RGB2YCrCb);
                    
                    // 分离通道
                    let channels = new cv.MatVector();
                    cv.split(ycrcbMat, channels);
                    
                    // 对亮度通道进行 CLAHE 处理
                    let clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
                    clahe.apply(channels.get(0), channels.get(0));
                    
                    // 合并通道
                    cv.merge(channels, ycrcbMat);
                    cv.cvtColor(ycrcbMat, enhancedMat, cv.COLOR_YCrCb2RGB);
                    
                    // 2. 锐化
                    let kernel = cv.Mat.ones(3, 3, cv.CV_32F);
                    kernel.data32F[4] = 5;  // 中心点权重
                    kernel.data32F[0] = -0.5; kernel.data32F[1] = -0.5; kernel.data32F[2] = -0.5;
                    kernel.data32F[3] = -0.5;                           kernel.data32F[5] = -0.5;
                    kernel.data32F[6] = -0.5; kernel.data32F[7] = -0.5; kernel.data32F[8] = -0.5;
                    
                    cv.filter2D(enhancedMat, tempMat, -1, kernel);
                    
                    // 3. 调整对比度和亮度
                    cv.convertScaleAbs(tempMat, enhancedMat, 1.2, 10);
                    
                    // 将结果转换为图像 URL
                    const resultImageUrl = this.matToImageUrl(enhancedMat);
                    
                    // 清理资源
                    ycrcbMat.delete();
                    channels.delete();
                    clahe.delete();
                    kernel.delete();
                    
                    return resultImageUrl;
                } catch (error) {
                    console.error('基本图像增强失败：', error);
                    return imageUrl;
                } finally {
                    enhancedMat.delete();
                    tempMat.delete();
                }
                
            } finally {
                // 清理资源
                srcMat.delete();
                grayMat.delete();
                blurredMat.delete();
                cannyMat.delete();
                dilatedMat.delete();
                contours.delete();
                hierarchy.delete();
                hsvMat.delete();
                maskMat.delete();
                resultMat.delete();
            }
            
        } catch (error) {
            console.error('身份证检测失败：', error);
            // 出错时返回原始图像
            return imageUrl;
        }
    }
}

// 导出 IDCardDetector 类
window.IDCardDetector = IDCardDetector;