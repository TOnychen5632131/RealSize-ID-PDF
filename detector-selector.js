/**
 * 身份证检测器选择器
 * 整合多种开源身份证检测方案，提供更好的识别效果
 */

class IDCardDetectorSelector {
    constructor() {
        this.detectors = {
            // 原始的 OpenCV.js 检测器
            original: null,
            // 基于 smartcrop.js 的检测器
            smartcrop: null,
            // 基于 TensorFlow.js 的检测器
            tensorflow: null,
            // 基于 HED 边缘检测的检测器
            hed: null
        };
        
        // 当前选择的检测器
        this.currentDetector = 'original';
        
        // 初始化检测器
        this.initDetectors();
    }
    
    /**
     * 初始化所有检测器
     */
    async initDetectors() {
        // 加载原始检测器
        if (typeof IDCardDetector !== 'undefined') {
            this.detectors.original = new IDCardDetector();
        }
        
        // 加载 smartcrop 检测器
        if (typeof SmartIDCardDetector !== 'undefined') {
            this.detectors.smartcrop = new SmartIDCardDetector();
        }
        
        // 加载 TensorFlow 检测器
        if (typeof TensorFlowIDCardDetector !== 'undefined') {
            this.detectors.tensorflow = new TensorFlowIDCardDetector();
        }
        
        // 加载 HED 检测器
        if (typeof HEDIDCardDetector !== 'undefined') {
            this.detectors.hed = new HEDIDCardDetector();
        }
    }
    
    /**
     * 设置当前使用的检测器
     * @param {string} detectorName - 检测器名称 ('original', 'smartcrop', 'tensorflow', 'hed')
     */
    setDetector(detectorName) {
        if (this.detectors[detectorName]) {
            this.currentDetector = detectorName;
            console.log(`已切换到 ${this.getDetectorDisplayName(detectorName)} 检测器`);
            return true;
        } else {
            console.error(`检测器 ${detectorName} 不可用`);
            return false;
        }
    }
    
    /**
     * 获取检测器的显示名称
     * @param {string} detectorName - 检测器名称
     * @returns {string} - 检测器的显示名称
     */
    getDetectorDisplayName(detectorName) {
        const displayNames = {
            'original': '原始 OpenCV',
            'smartcrop': 'SmartCrop 智能裁剪',
            'tensorflow': 'TensorFlow 深度学习',
            'hed': 'HED 边缘检测'
        };
        
        return displayNames[detectorName] || detectorName;
    }
    
    /**
     * 获取所有可用的检测器
     * @returns {Array} - 可用检测器列表
     */
    getAvailableDetectors() {
        return Object.keys(this.detectors).filter(key => this.detectors[key] !== null);
    }
    
    /**
     * 检测并提取图像中的身份证
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @returns {Promise<string>} - 提取出的身份证图像的 Base64 URL
     */
    async detectIDCard(imageUrl) {
        // 获取当前选择的检测器
        const detector = this.detectors[this.currentDetector];
        
        if (!detector) {
            console.error('当前检测器不可用，使用原始图像');
            return imageUrl;
        }
        
        try {
            // 使用选定的检测器进行身份证检测
            return await detector.detectIDCard(imageUrl);
        } catch (error) {
            console.error(`使用 ${this.getDetectorDisplayName(this.currentDetector)} 检测器失败：`, error);
            
            // 如果当前检测器失败，尝试使用原始检测器作为备选
            if (this.currentDetector !== 'original' && this.detectors.original) {
                console.log('尝试使用原始检测器作为备选');
                try {
                    return await this.detectors.original.detectIDCard(imageUrl);
                } catch (fallbackError) {
                    console.error('备选检测器也失败：', fallbackError);
                }
            }
            
            // 所有检测器都失败，返回原始图像
            return imageUrl;
        }
    }
}