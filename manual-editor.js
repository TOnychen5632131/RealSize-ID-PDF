/**
 * Manual ID Card Editor
 * 提供手动调整身份证图像的功能，包括拖拽、缩放、旋转和四角透视调整
 */

class ManualIDCardEditor {
    constructor() {
        this.isInteractJsReady = false;
        this.currentImage = null;
        this.currentSide = null;
        this.originalImageData = null;
        this.editorContainer = null;
        this.imageElement = null;
        this.cornerHandles = [];
        this.isCornerMode = false;
        this.cornerPositions = [];
        this.loadInteractJs();
    }

    /**
     * 加载 interact.js 库
     */
    loadInteractJs() {
        return new Promise((resolve, reject) => {
            // 如果 interact.js 已经加载，直接返回
            if (window.interact) {
                this.isInteractJsReady = true;
                console.log('interact.js 已加载');
                resolve();
                return;
            }

            // 创建 script 标签加载 interact.js
            const script = document.createElement('script');
            script.setAttribute('async', '');
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', 'https://cdn.jsdelivr.net/npm/interactjs@1.10.17/dist/interact.min.js');
            
            // 加载成功回调
            script.onload = () => {
                console.log('interact.js 加载成功');
                this.isInteractJsReady = true;
                resolve();
            };
            
            // 加载失败回调
            script.onerror = (err) => {
                console.error('interact.js 加载失败：', err);
                reject(new Error('interact.js 加载失败'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * 等待依赖库加载完成
     */
    async waitForDependencies() {
        if (!this.isInteractJsReady) {
            try {
                await this.loadInteractJs();
            } catch (error) {
                console.error('等待依赖库加载失败：', error);
                throw error;
            }
        }
    }

    /**
     * 打开编辑器
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     * @param {string} side - 身份证的正面或背面 ('front' 或 'back')
     * @param {Function} onSave - 保存回调函数，接收处理后的图像 URL
     */
    async openEditor(imageUrl, side, onSave) {
        try {
            // 等待依赖库加载完成
            await this.waitForDependencies();
            
            this.currentImage = imageUrl;
            this.currentSide = side;
            this.originalImageData = imageUrl;
            
            // 重置角点位置数组，确保每次打开编辑器时都是空的
            this.cornerPositions = [];
            this.isCornerMode = false;
            
            // 清空角点控制手柄数组
            this.cornerHandles = [];
            
            // 创建编辑器 UI
            this.createEditorUI(onSave);
            
            // 加载图像
            this.loadImage(imageUrl);
            
            // 初始化交互功能
            this.initializeInteractions();
        } catch (error) {
            console.error('打开编辑器失败：', error);
            throw error;
        }
    }

    /**
     * 创建编辑器 UI
     * @param {Function} onSave - 保存回调函数
     */
    createEditorUI(onSave) {
        // 创建编辑器容器
        this.editorContainer = document.createElement('div');
        this.editorContainer.className = 'manual-editor-container';
        
        // 创建编辑区域
        const editorArea = document.createElement('div');
        editorArea.className = 'editor-area';
        
        // 创建图像容器
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';
        
        // 创建图像元素
        this.imageElement = document.createElement('img');
        this.imageElement.className = 'editable-image';
        imageContainer.appendChild(this.imageElement);
        
        // 创建四个角点控制手柄
        for (let i = 0; i < 4; i++) {
            const handle = document.createElement('div');
            handle.className = 'corner-handle';
            handle.dataset.corner = i;
            handle.style.display = 'none'; // 初始隐藏
            imageContainer.appendChild(handle);
            this.cornerHandles.push(handle);
        }
        
        // 创建控制按钮
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'editor-controls';
        
        // 旋转按钮
        const rotateLeftBtn = document.createElement('button');
        rotateLeftBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 3v5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> 向左旋转';
        rotateLeftBtn.addEventListener('click', () => this.rotate(-90));
        
        const rotateRightBtn = document.createElement('button');
        rotateRightBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 3v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> 向右旋转';
        rotateRightBtn.addEventListener('click', () => this.rotate(90));
        
        // 四角调整按钮
        const cornerModeBtn = document.createElement('button');
        cornerModeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 3h7v7H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 3h7v7h-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 14h7v7h-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 14h7v7H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> 四角调整';
        cornerModeBtn.addEventListener('click', () => this.toggleCornerMode());
        
        // 重置按钮
        const resetBtn = document.createElement('button');
        resetBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 3v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> 重置';
        resetBtn.addEventListener('click', () => this.resetImage());
        
        // 保存和取消按钮
        const saveBtn = document.createElement('button');
        saveBtn.className = 'primary-btn';
        saveBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 21v-8H7v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 3v5h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> 保存';
        saveBtn.addEventListener('click', () => {
            const processedImage = this.processImage();
            onSave(processedImage);
            this.closeEditor();
        });
        
        const cancelBtn = document.createElement('button');
        cancelBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> 取消';
        cancelBtn.addEventListener('click', () => this.closeEditor());
        
        // 添加按钮到控制容器
        controlsContainer.appendChild(rotateLeftBtn);
        controlsContainer.appendChild(rotateRightBtn);
        controlsContainer.appendChild(cornerModeBtn);
        controlsContainer.appendChild(resetBtn);
        controlsContainer.appendChild(saveBtn);
        controlsContainer.appendChild(cancelBtn);
        
        // 添加提示信息
        const helpText = document.createElement('p');
        helpText.className = 'editor-help-text';
        helpText.textContent = '提示：拖动图像调整位置，使用按钮缩放和旋转，或使用四角调整功能精确调整';
        controlsContainer.appendChild(helpText);
        
        // 组装编辑器
        editorArea.appendChild(imageContainer);
        this.editorContainer.appendChild(editorArea);
        this.editorContainer.appendChild(controlsContainer);
        
        // 添加到文档
        document.body.appendChild(this.editorContainer);
        
        // 添加样式
        this.addEditorStyles();
    }

    /**
     * 添加编辑器样式
     */
    addEditorStyles() {
        // 检查是否已存在样式
        if (document.getElementById('manual-editor-styles')) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'manual-editor-styles';
        styleElement.textContent = `
            .manual-editor-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(55, 53, 47, 0.65);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            
            .editor-area {
                width: 80%;
                height: 70%;
                background-color: var(--notion-light-gray);
                border-radius: 3px;
                overflow: hidden;
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
            }
            
            .image-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }
            
            .editable-image {
                max-width: 90%;
                max-height: 90%;
                touch-action: none;
                user-select: none;
                cursor: move;
                transform-origin: center;
            }
            
            .corner-handle {
                position: absolute;
                width: 20px;
                height: 20px;
                background-color: rgba(35, 130, 226, 0.9);
                border: 2px solid white;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10;
                touch-action: none;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                transition: transform 0.1s ease;
            }
            
            .corner-handle:hover {
                transform: scale(1.2);
            }
            
            .corner-handle[data-corner="0"] {
                cursor: nw-resize;
            }
            
            .corner-handle[data-corner="1"] {
                cursor: ne-resize;
            }
            
            .corner-handle[data-corner="2"] {
                cursor: se-resize;
            }
            
            .corner-handle[data-corner="3"] {
                cursor: sw-resize;
            }
            
            .editor-controls {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .editor-controls button {
                padding: 6px 12px;
                background-color: var(--notion-white);
                color: var(--notion-text);
                border: 1px solid var(--notion-border);
                border-radius: 3px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.1s ease-in-out;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 6px;
                height: 32px;
            }
            
            .editor-controls button:hover {
                background-color: var(--notion-hover);
            }
            
            .editor-controls button:active {
                background-color: var(--notion-active);
            }
            
            .editor-controls button.primary-btn {
                background-color: var(--notion-blue);
                color: white;
                border-color: var(--notion-blue);
            }
            
            .editor-controls button.primary-btn:hover {
                background-color: #1a6dca;
            }
            
            .editor-help-text {
                width: 100%;
                text-align: center;
                margin-top: 10px;
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
            }
            
            .perspective-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 5;
            }
        `;
        
        document.head.appendChild(styleElement);
    }

    /**
     * 加载图像
     * @param {string} imageUrl - 图像的 URL 或 Base64 字符串
     */
    loadImage(imageUrl) {
        this.imageElement.src = imageUrl;
        this.imageElement.style.transform = 'translate(0px, 0px) scale(1) rotate(0deg)';
        
        // 图像加载完成后初始化角点位置
        this.imageElement.onload = () => {
            this.initializeCornerPositions();
        };
    }
    
    /**
     * 初始化四个角点的位置
     */
    initializeCornerPositions() {
        // 获取图像的实际显示尺寸和位置
        const rect = this.imageElement.getBoundingClientRect();
        const containerRect = this.imageElement.parentElement.getBoundingClientRect();
        
        // 计算图像相对于容器的位置
        const offsetX = rect.left - containerRect.left;
        const offsetY = rect.top - containerRect.top;
        
        // 设置四个角点的初始位置
        this.cornerPositions = [
            { x: offsetX, y: offsetY }, // 左上
            { x: offsetX + rect.width, y: offsetY }, // 右上
            { x: offsetX + rect.width, y: offsetY + rect.height }, // 右下
            { x: offsetX, y: offsetY + rect.height } // 左下
        ];
        
        // 更新角点控制手柄的位置
        this.updateCornerHandles();
    }
    
    /**
     * 切换四角调整模式
     */
    toggleCornerMode() {
        this.isCornerMode = !this.isCornerMode;
        
        // 更新角点控制手柄的可见性
        this.cornerHandles.forEach(handle => {
            handle.style.display = this.isCornerMode ? 'block' : 'none';
        });
        
        // 移除现有的透视叠加层
        const existingOverlay = document.querySelector('.perspective-overlay');
        if (existingOverlay && existingOverlay.parentNode) {
            existingOverlay.parentNode.removeChild(existingOverlay);
        }
        
        // 在切换模式时强制重新初始化角点位置
        if (this.isCornerMode) {
            // 清空角点位置数组，确保重新初始化
            this.cornerPositions = [];
            
            // 确保图像已完全加载并且 DOM 已更新
            setTimeout(() => {
                this.initializeCornerPositions();
                this.initializeCornerDragging();
                this.updateCornerHandles();
                
                // 应用透视变换以显示选择区域
                this.applyPerspectiveTransform();
            }, 50);
        }
    }
    
    /**
     * 更新角点控制手柄的位置
     */
    updateCornerHandles() {
        for (let i = 0; i < 4; i++) {
            const handle = this.cornerHandles[i];
            const pos = this.cornerPositions[i];
            handle.style.left = `${pos.x - 10}px`; // 10px 是手柄宽度的一半
            handle.style.top = `${pos.y - 10}px`; // 10px 是手柄高度的一半
        }
    }
    
    /**
     * 初始化角点拖拽功能
     */
    initializeCornerDragging() {
        // 确保 interact.js 已加载
        if (!window.interact) {
            console.error('interact.js 未加载');
            return;
        }
        
        // 为每个角点添加拖拽功能
        this.cornerHandles.forEach((handle, index) => {
            interact(handle).draggable({
                inertia: false,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                listeners: {
                    move: (event) => {
                        // 更新角点位置
                        this.cornerPositions[index].x += event.dx;
                        this.cornerPositions[index].y += event.dy;
                        
                        // 更新角点控制手柄的位置
                        this.updateCornerHandles();
                        
                        // 应用透视变换
                        this.applyPerspectiveTransform();
                    }
                }
            });
        });
    }
    
    /**
     * 应用透视变换
     */
    applyPerspectiveTransform() {
        // 创建或获取透视叠加层
        let overlay = document.querySelector('.perspective-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'perspective-overlay';
            this.imageElement.parentElement.appendChild(overlay);
        }
        
        // 清除叠加层内容
        overlay.innerHTML = '';
        
        // 创建 SVG 多边形来显示选择区域
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = this.cornerPositions.map(p => `${p.x},${p.y}`).join(' ');
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', 'rgba(35, 130, 226, 0.2)');
        polygon.setAttribute('stroke', 'rgba(35, 130, 226, 0.8)');
        polygon.setAttribute('stroke-width', '2');
        
        svg.appendChild(polygon);
        overlay.appendChild(svg);
    }
    
    /**
     * 初始化交互功能
     */
    initializeInteractions() {
        // 确保 interact.js 已加载
        if (!window.interact) {
            console.error('interact.js 未加载');
            return;
        }
        
        // 初始化拖拽功能
        interact(this.imageElement).draggable({
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ],
            listeners: {
                move: this.dragMoveListener.bind(this)
            }
        });
    }

    /**
     * 拖拽事件监听器
     * @param {Event} event - 拖拽事件
     */
    dragMoveListener(event) {
        const target = event.target;
        
        // 获取当前变换信息
        const transform = this.parseTransform(target.style.transform);
        
        // 更新位置
        transform.translateX += event.dx;
        transform.translateY += event.dy;
        
        // 应用变换
        target.style.transform = this.buildTransform(transform);
    }

    /**
     * 解析变换字符串
     * @param {string} transformStr - CSS 变换字符串
     * @returns {Object} - 变换参数对象
     */
    parseTransform(transformStr) {
        const transform = {
            translateX: 0,
            translateY: 0,
            scale: 1,
            rotate: 0
        };
        
        if (!transformStr) return transform;
        
        // 提取 translate 值
        const translateMatch = transformStr.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (translateMatch) {
            transform.translateX = parseFloat(translateMatch[1]);
            transform.translateY = parseFloat(translateMatch[2]);
        }
        
        // 提取 scale 值
        const scaleMatch = transformStr.match(/scale\(([^)]+)\)/);
        if (scaleMatch) {
            transform.scale = parseFloat(scaleMatch[1]);
        }
        
        // 提取 rotate 值
        const rotateMatch = transformStr.match(/rotate\(([^)]+)deg\)/);
        if (rotateMatch) {
            transform.rotate = parseFloat(rotateMatch[1]);
        }
        
        return transform;
    }

    /**
     * 构建变换字符串
     * @param {Object} transform - 变换参数对象
     * @returns {string} - CSS 变换字符串
     */
    buildTransform(transform) {
        return `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale}) rotate(${transform.rotate}deg)`;
    }

    /**
     * 缩放图像
     * @param {number} factor - 缩放因子
     */
    zoom(factor) {
        const transform = this.parseTransform(this.imageElement.style.transform);
        transform.scale *= factor;
        
        // 限制缩放范围
        transform.scale = Math.max(0.1, Math.min(transform.scale, 3));
        
        this.imageElement.style.transform = this.buildTransform(transform);
    }

    /**
     * 旋转图像
     * @param {number} degrees - 旋转角度
     */
    rotate(degrees) {
        const transform = this.parseTransform(this.imageElement.style.transform);
        transform.rotate += degrees;
        this.imageElement.style.transform = this.buildTransform(transform);
    }

    /**
     * 重置图像
     */
    resetImage() {
        this.imageElement.style.transform = 'translate(0px, 0px) scale(1) rotate(0deg)';
        
        // 如果在四角调整模式，重置角点位置
        if (this.isCornerMode) {
            this.initializeCornerPositions();
            this.updateCornerHandles();
            this.applyPerspectiveTransform();
        }
    }

    /**
     * 处理图像并返回结果
     * @returns {string} - 处理后的图像 URL
     */
    processImage() {
        // 创建 Canvas 元素
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 保存当前状态，用于处理完成后重置
        const currentState = {
            isCornerMode: this.isCornerMode,
            cornerPositions: [...this.cornerPositions],
            transform: this.parseTransform(this.imageElement.style.transform)
        };
        
        if (this.isCornerMode && this.cornerPositions.length === 4) {
            // 在四角调整模式下应用透视变换
            
            // 获取图像的实际显示尺寸和位置
            const imgRect = this.imageElement.getBoundingClientRect();
            const containerRect = this.imageElement.parentElement.getBoundingClientRect();
            
            // 计算角点相对于图像的比例位置
            const relativeCorners = this.cornerPositions.map(pos => {
                return {
                    x: (pos.x - (imgRect.left - containerRect.left)) / imgRect.width,
                    y: (pos.y - (imgRect.top - containerRect.top)) / imgRect.height
                };
            });
            
            // 计算选择区域的宽度和高度（使用对角线长度估算）
            const dx1 = relativeCorners[1].x - relativeCorners[0].x;
            const dy1 = relativeCorners[1].y - relativeCorners[0].y;
            const dx2 = relativeCorners[3].x - relativeCorners[2].x;
            const dy2 = relativeCorners[3].y - relativeCorners[2].y;
            const dx3 = relativeCorners[2].x - relativeCorners[1].x;
            const dy3 = relativeCorners[2].y - relativeCorners[1].y;
            const dx4 = relativeCorners[3].x - relativeCorners[0].x;
            const dy4 = relativeCorners[3].y - relativeCorners[0].y;
            
            // 计算选择区域的宽度和高度（取平均值）
            const width = Math.round((Math.sqrt(dx1*dx1 + dy1*dy1) + Math.sqrt(dx2*dx2 + dy2*dy2)) / 2 * this.imageElement.naturalWidth);
            const height = Math.round((Math.sqrt(dx3*dx3 + dy3*dy3) + Math.sqrt(dx4*dx4 + dy4*dy4)) / 2 * this.imageElement.naturalHeight);
            
            // 设置 Canvas 尺寸为选择区域的尺寸
            canvas.width = width;
            canvas.height = height;
            
            // 源点（相对于原始图像尺寸）
            const srcPoints = [
                relativeCorners[0].x * this.imageElement.naturalWidth, relativeCorners[0].y * this.imageElement.naturalHeight, // 左上
                relativeCorners[1].x * this.imageElement.naturalWidth, relativeCorners[1].y * this.imageElement.naturalHeight, // 右上
                relativeCorners[2].x * this.imageElement.naturalWidth, relativeCorners[2].y * this.imageElement.naturalHeight, // 右下
                relativeCorners[3].x * this.imageElement.naturalWidth, relativeCorners[3].y * this.imageElement.naturalHeight  // 左下
            ];
            
            // 目标点（标准矩形）
            const dstPoints = [
                0, 0,                // 左上
                width, 0,            // 右上
                width, height,       // 右下
                0, height            // 左下
            ];
            
            // 使用透视变换矩阵
            const perspectiveTransform = this.getPerspectiveTransform(srcPoints, dstPoints);
            this.warpPerspective(canvas, ctx, this.imageElement, perspectiveTransform);
        } else {
            // 在普通模式下应用基本变换
            
            // 获取图像变换信息
            const transform = this.parseTransform(this.imageElement.style.transform);
            
            // 设置 Canvas 尺寸为图像的实际尺寸
            canvas.width = this.imageElement.naturalWidth;
            canvas.height = this.imageElement.naturalHeight;
            
            // 应用变换
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(transform.rotate * Math.PI / 180);
            ctx.scale(transform.scale, transform.scale);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            
            // 应用位移（需要调整位移量以适应 Canvas 坐标系）
            ctx.translate(transform.translateX / transform.scale, transform.translateY / transform.scale);
            
            // 绘制图像
            ctx.drawImage(this.imageElement, 0, 0, canvas.width, canvas.height);
        }
        
        // 应用圆角效果到处理后的图像
        this.applyRoundedCorners(canvas, ctx);
        
        // 处理完成后，重置编辑器状态，为下次编辑做准备
        // 这样可以确保下次打开四角调整模式时能正确初始化
        this.isCornerMode = false;
        this.cornerPositions = [];
        
        // 隐藏所有角点控制手柄
        this.cornerHandles.forEach(handle => {
            handle.style.display = 'none';
        });
        
        // 移除透视叠加层
        const overlay = document.querySelector('.perspective-overlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        // 返回处理后的图像 URL
        return canvas.toDataURL('image/jpeg', 0.9);
    }
    
    /**
     * 应用圆角效果到图像
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     */
    applyRoundedCorners(canvas, ctx) {
        const radius = Math.min(canvas.width, canvas.height) * 0.05; // 圆角半径为宽高的 5%
        const width = canvas.width;
        const height = canvas.height;
        
        // 保存当前图像数据
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // 清除 Canvas
        ctx.clearRect(0, 0, width, height);
        
        // 绘制圆角矩形路径
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(width - radius, 0);
        ctx.quadraticCurveTo(width, 0, width, radius);
        ctx.lineTo(width, height - radius);
        ctx.quadraticCurveTo(width, height, width - radius, height);
        ctx.lineTo(radius, height);
        ctx.quadraticCurveTo(0, height, 0, height - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        
        // 创建裁剪区域
        ctx.clip();
        
        // 将原始图像数据放回 Canvas
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * 计算透视变换矩阵
     * @param {Array} src - 源点坐标数组 [x1,y1, x2,y2, x3,y3, x4,y4]
     * @param {Array} dst - 目标点坐标数组 [x1,y1, x2,y2, x3,y3, x4,y4]
     * @returns {Array} - 3x3 透视变换矩阵
     */
    getPerspectiveTransform(src, dst) {
        const srcMatrix = [
            [src[0], src[1], 1, 0, 0, 0, -src[0] * dst[0], -src[1] * dst[0]],
            [0, 0, 0, src[0], src[1], 1, -src[0] * dst[1], -src[1] * dst[1]],
            [src[2], src[3], 1, 0, 0, 0, -src[2] * dst[2], -src[3] * dst[2]],
            [0, 0, 0, src[2], src[3], 1, -src[2] * dst[3], -src[3] * dst[3]],
            [src[4], src[5], 1, 0, 0, 0, -src[4] * dst[4], -src[5] * dst[4]],
            [0, 0, 0, src[4], src[5], 1, -src[4] * dst[5], -src[5] * dst[5]],
            [src[6], src[7], 1, 0, 0, 0, -src[6] * dst[6], -src[7] * dst[6]],
            [0, 0, 0, src[6], src[7], 1, -src[6] * dst[7], -src[7] * dst[7]]
        ];
        
        const dstVector = [dst[0], dst[1], dst[2], dst[3], dst[4], dst[5], dst[6], dst[7]];
        
        // 使用高斯消元法求解线性方程组
        const h = this.solveLinearSystem(srcMatrix, dstVector);
        h.push(1.0); // 添加 h33=1
        
        return h;
    }
    
    /**
     * 使用高斯消元法求解线性方程组
     * @param {Array} A - 系数矩阵
     * @param {Array} b - 常数向量
     * @returns {Array} - 解向量
     */
    solveLinearSystem(A, b) {
        const n = A.length;
        const augmentedMatrix = A.map((row, i) => [...row, b[i]]);
        
        // 高斯消元
        for (let i = 0; i < n; i++) {
            // 寻找主元
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(augmentedMatrix[j][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
                    maxRow = j;
                }
            }
            
            // 交换行
            [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]];
            
            // 消元
            for (let j = i + 1; j < n; j++) {
                const factor = augmentedMatrix[j][i] / augmentedMatrix[i][i];
                for (let k = i; k <= n; k++) {
                    augmentedMatrix[j][k] -= factor * augmentedMatrix[i][k];
                }
            }
        }
        
        // 回代
        const x = new Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += augmentedMatrix[i][j] * x[j];
            }
            x[i] = (augmentedMatrix[i][n] - sum) / augmentedMatrix[i][i];
        }
        
        return x;
    }
    
    /**
     * 应用透视变换
     * @param {HTMLCanvasElement} canvas - 目标Canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {HTMLImageElement} image - 源图像
     * @param {Array} transform - 透视变换矩阵
     */
    warpPerspective(canvas, ctx, image, transform) {
        const width = canvas.width;
        const height = canvas.height;
        
        // 创建临时Canvas用于绘制原始图像
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.naturalWidth;
        tempCanvas.height = image.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(image, 0, 0);
        
        // 获取原始图像数据
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const srcData = imageData.data;
        
        // 创建目标图像数据
        const destImageData = ctx.createImageData(width, height);
        const destData = destImageData.data;
        
        // 计算逆变换矩阵
        const invTransform = this.invertMatrix(transform);
        
        // 应用透视变换
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // 应用逆变换矩阵计算源坐标
                const denominator = invTransform[6] * x + invTransform[7] * y + invTransform[8];
                const srcX = (invTransform[0] * x + invTransform[1] * y + invTransform[2]) / denominator;
                const srcY = (invTransform[3] * x + invTransform[4] * y + invTransform[5]) / denominator;
                
                // 检查源坐标是否在图像范围内
                if (srcX >= 0 && srcX < tempCanvas.width && srcY >= 0 && srcY < tempCanvas.height) {
                    // 使用双线性插值获取像素值
                    const x0 = Math.floor(srcX);
                    const y0 = Math.floor(srcY);
                    const x1 = Math.min(x0 + 1, tempCanvas.width - 1);
                    const y1 = Math.min(y0 + 1, tempCanvas.height - 1);
                    
                    const dx = srcX - x0;
                    const dy = srcY - y0;
                    
                    // 获取四个相邻像素
                    const p00 = this.getPixel(srcData, x0, y0, tempCanvas.width);
                    const p10 = this.getPixel(srcData, x1, y0, tempCanvas.width);
                    const p01 = this.getPixel(srcData, x0, y1, tempCanvas.width);
                    const p11 = this.getPixel(srcData, x1, y1, tempCanvas.width);
                    
                    // 双线性插值
                    const destIndex = (y * width + x) * 4;
                    for (let c = 0; c < 4; c++) {
                        const interpolated = 
                            p00[c] * (1 - dx) * (1 - dy) +
                            p10[c] * dx * (1 - dy) +
                            p01[c] * (1 - dx) * dy +
                            p11[c] * dx * dy;
                        
                        destData[destIndex + c] = interpolated;
                    }
                }
            }
        }
        
        // 将处理后的图像数据绘制到 Canvas 上
        ctx.putImageData(destImageData, 0, 0);
    }
    
    /**
     * 计算矩阵的逆矩阵
     * @param {Array} matrix - 3x3矩阵（以一维数组表示）
     * @returns {Array} - 逆矩阵
     */
    invertMatrix(matrix) {
        // 计算行列式
        const det = 
            matrix[0] * (matrix[4] * matrix[8] - matrix[5] * matrix[7]) -
            matrix[1] * (matrix[3] * matrix[8] - matrix[5] * matrix[6]) +
            matrix[2] * (matrix[3] * matrix[7] - matrix[4] * matrix[6]);
        
        if (Math.abs(det) < 1e-10) {
            console.error('矩阵不可逆');
            return matrix; // 返回原矩阵作为后备
        }
        
        // 计算伴随矩阵
        const adj = [
            matrix[4] * matrix[8] - matrix[5] * matrix[7],
            matrix[2] * matrix[7] - matrix[1] * matrix[8],
            matrix[1] * matrix[5] - matrix[2] * matrix[4],
            matrix[5] * matrix[6] - matrix[3] * matrix[8],
            matrix[0] * matrix[8] - matrix[2] * matrix[6],
            matrix[2] * matrix[3] - matrix[0] * matrix[5],
            matrix[3] * matrix[7] - matrix[4] * matrix[6],
            matrix[1] * matrix[6] - matrix[0] * matrix[7],
            matrix[0] * matrix[4] - matrix[1] * matrix[3]
        ];
        
        // 计算逆矩阵
        const invDet = 1 / det;
        return adj.map(val => val * invDet);
    }
    
    /**
     * 计算矩阵的逆矩阵
     * @param {Array} matrix - 3x3 矩阵（以一维数组表示）
     * @returns {Array} - 逆矩阵
     */
    invertMatrix(matrix) {
        // 计算行列式
        const det = 
            matrix[0] * (matrix[4] * matrix[8] - matrix[5] * matrix[7]) -
            matrix[1] * (matrix[3] * matrix[8] - matrix[5] * matrix[6]) +
            matrix[2] * (matrix[3] * matrix[7] - matrix[4] * matrix[6]);
        
        if (Math.abs(det) < 1e-10) {
            console.error('矩阵不可逆');
            return matrix; // 返回原矩阵作为后备
        }
        
        // 计算伴随矩阵
        const adj = [
            matrix[4] * matrix[8] - matrix[5] * matrix[7],
            matrix[2] * matrix[7] - matrix[1] * matrix[8],
            matrix[1] * matrix[5] - matrix[2] * matrix[4],
            matrix[5] * matrix[6] - matrix[3] * matrix[8],
            matrix[0] * matrix[8] - matrix[2] * matrix[6],
            matrix[2] * matrix[3] - matrix[0] * matrix[5],
            matrix[3] * matrix[7] - matrix[4] * matrix[6],
            matrix[1] * matrix[6] - matrix[0] * matrix[7],
            matrix[0] * matrix[4] - matrix[1] * matrix[3]
        ];
        
        // 计算逆矩阵
        const invDet = 1 / det;
        return adj.map(val => val * invDet);
    }
    
    /**
     * 获取图像数据中的像素值
     * @param {Uint8ClampedArray} data - 图像数据
     * @param {number} x - x 坐标
     * @param {number} y - y 坐标
     * @param {number} width - 图像宽度
     * @returns {Array} - RGBA 像素值
     */
    getPixel(data, x, y, width) {
        const index = (y * width + x) * 4;
        return [
            data[index],     // R
            data[index + 1], // G
            data[index + 2], // B
            data[index + 3]  // A
        ];
    }
    
    /**
     * 关闭编辑器
     */
    closeEditor() {
        if (this.editorContainer && this.editorContainer.parentNode) {
            this.editorContainer.parentNode.removeChild(this.editorContainer);
        }
        
        // 清除引用和状态
        this.editorContainer = null;
        this.imageElement = null;
        this.cornerHandles = [];
        this.cornerPositions = [];
        this.isCornerMode = false;
        
        // 移除透视叠加层
        const overlay = document.querySelector('.perspective-overlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }
}