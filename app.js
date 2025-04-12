document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const frontInput = document.getElementById('front-input');
    const backInput = document.getElementById('back-input');
    const frontPreview = document.getElementById('front-preview');
    const backPreview = document.getElementById('back-preview');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const pdfPreview = document.getElementById('pdf-preview');
    const pdfPreviewPlaceholder = document.getElementById('pdf-preview-placeholder');
    const detectorSelect = document.getElementById('detector-select');
    const detectorDescription = document.getElementById('detector-description');
    const frontEditBtn = document.getElementById('front-edit-btn');
    const backEditBtn = document.getElementById('back-edit-btn');

    // 创建身份证检测器选择器实例
    const detectorSelector = new IDCardDetectorSelector();
    
    // 创建手动编辑器实例
    const manualEditor = new ManualIDCardEditor();

    // Image data storage
    let frontImage = null;
    let backImage = null;
    let pdfBlob = null;
    
    // 检测器描述信息
    const detectorDescriptions = {
        'original': '原始 OpenCV 检测器：基于传统计算机视觉方法，适用于清晰、对比度高的图像。',
        'smartcrop': 'SmartCrop 智能裁剪：使用内容感知裁剪技术，更好地保留身份证关键区域。',
        'tensorflow': 'TensorFlow 深度学习：使用神经网络模型，适用于复杂背景和光线条件下的图像。',
        'hed': 'HED 边缘检测：使用全息嵌套边缘检测，对身份证边缘提取效果更好。'
    };
    
    // 初始化检测器选择器
    window.addEventListener('load', function() {
        // 更新可用检测器列表
        const availableDetectors = detectorSelector.getAvailableDetectors();
        
        // 检查是否为移动设备
        const isMobile = window.innerWidth <= 768;
        
        // 在移动设备上默认使用原始检测器
        if (isMobile) {
            if (availableDetectors.includes('original')) {
                detectorSelector.setDetector('original');
            } else if (availableDetectors.length > 0) {
                detectorSelector.setDetector(availableDetectors[0]);
            }
        } else if (detectorSelect) {
            // 在桌面设备上允许选择检测器
            // 禁用不可用的检测器选项
            Array.from(detectorSelect.options).forEach(option => {
                if (!availableDetectors.includes(option.value)) {
                    option.disabled = true;
                    option.text += ' (不可用)';
                }
            });
            
            // 设置默认检测器
            if (availableDetectors.length > 0) {
                detectorSelect.value = availableDetectors[0];
                detectorSelector.setDetector(availableDetectors[0]);
                updateDetectorDescription(availableDetectors[0]);
            }
        }
    });
    
    // 监听窗口大小变化，在移动设备和桌面设备之间切换时调整
    window.addEventListener('resize', function() {
        const isMobile = window.innerWidth <= 768;
        const availableDetectors = detectorSelector.getAvailableDetectors();
        
        // 在移动设备上自动切换到原始检测器
        if (isMobile && availableDetectors.includes('original')) {
            detectorSelector.setDetector('original');
        }
    });
    
    // 检测器选择变化事件
    if (detectorSelect) {
        detectorSelect.addEventListener('change', function() {
            const selectedDetector = detectorSelect.value;
            detectorSelector.setDetector(selectedDetector);
            updateDetectorDescription(selectedDetector);
        });
    }
    
    // 更新检测器描述
    function updateDetectorDescription(detectorName) {
        detectorDescription.textContent = detectorDescriptions[detectorName] || '';
    }

    // ID Card dimensions in mm (standard size)
    const ID_CARD_WIDTH = 85.6; // mm
    const ID_CARD_HEIGHT = 54;  // mm

    // A4 dimensions in mm
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;

    // Event listeners for file inputs
    frontInput.addEventListener('change', function(e) {
        handleImageUpload(e, frontPreview, 'front');
    });

    backInput.addEventListener('change', function(e) {
        handleImageUpload(e, backPreview, 'back');
    });

    // Drag and drop functionality
    setupDragAndDrop('front-upload', 'front');
    setupDragAndDrop('back-upload', 'back');

    // Generate PDF button
    generateBtn.addEventListener('click', generatePDF);

    // Download PDF button
    downloadBtn.addEventListener('click', function() {
        if (pdfBlob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(pdfBlob);
            link.download = 'id_card_scan.pdf';
            link.click();
        }
    });

    // Handle image upload
    function handleImageUpload(event, previewElement, side) {
        const file = event.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = async function(e) {
                const originalImage = e.target.result;
                
                // 显示加载状态
                previewElement.parentElement.classList.add('processing');
                
                try {
                    // 使用选定的检测器提取身份证
                    const processedImage = await detectorSelector.detectIDCard(originalImage);
                    
                    // 更新预览图
                    previewElement.src = processedImage;
                    previewElement.style.display = 'block';
                    
                    // 存储处理后的图像数据
                    if (side === 'front') {
                        frontImage = processedImage;
                        frontEditBtn.style.display = 'block';
                    } else {
                        backImage = processedImage;
                        backEditBtn.style.display = 'block';
                    }
                } catch (error) {
                    console.error('身份证检测失败：', error);
                    // 出错时使用原始图像
                    previewElement.src = originalImage;
                    previewElement.style.display = 'block';
                    
                    // 存储原始图像数据
                    if (side === 'front') {
                        frontImage = originalImage;
                    } else {
                        backImage = originalImage;
                    }
                } finally {
                    // 移除加载状态
                    previewElement.parentElement.classList.remove('processing');
                    // 启用生成按钮
                    updateButtonState();
                }
            };
            
            reader.readAsDataURL(file);
        }
    }

    // Setup drag and drop functionality
    function setupDragAndDrop(elementId, side) {
        const element = document.getElementById(elementId);
        const previewElement = side === 'front' ? frontPreview : backPreview;
        const inputElement = side === 'front' ? frontInput : backInput;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            element.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            element.style.borderColor = '#2382E2';
            element.style.backgroundColor = 'var(--notion-light-gray)';
            element.style.transform = 'translateY(-1px)';
        }
        
        function unhighlight() {
            element.style.borderColor = 'var(--notion-border)';
            element.style.backgroundColor = 'white';
            element.style.transform = 'none';
        }
        
        element.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                
                reader.onload = async function(e) {
                    const originalImage = e.target.result;
                    
                    // 显示加载状态
                    previewElement.parentElement.classList.add('processing');
                    
                    try {
                        // 使用选定的检测器提取身份证
                        const processedImage = await detectorSelector.detectIDCard(originalImage);
                        
                        // 更新预览图
                        previewElement.src = processedImage;
                        previewElement.style.display = 'block';
                        
                        // 存储处理后的图像数据
                        if (side === 'front') {
                            frontImage = processedImage;
                            frontEditBtn.style.display = 'block';
                        } else {
                            backImage = processedImage;
                            backEditBtn.style.display = 'block';
                        }
                    } catch (error) {
                        console.error('身份证检测失败：', error);
                        // 出错时使用原始图像
                        previewElement.src = originalImage;
                        previewElement.style.display = 'block';
                        
                        // 存储原始图像数据
                        if (side === 'front') {
                            frontImage = originalImage;
                        } else {
                            backImage = originalImage;
                        }
                    } finally {
                        // 移除加载状态
                        previewElement.parentElement.classList.remove('processing');
                        // 启用生成按钮
                        updateButtonState();
                    }
                };
                
                reader.readAsDataURL(file);
            }
        }
    }

    // Update button states based on uploaded images
    function updateButtonState() {
        if (frontImage || backImage) {
            generateBtn.disabled = false;
        } else {
            generateBtn.disabled = true;
            downloadBtn.disabled = true;
        }
        
        // 更新编辑按钮状态
        frontEditBtn.style.display = frontImage ? 'block' : 'none';
        backEditBtn.style.display = backImage ? 'block' : 'none';
    }
    
    // 手动编辑按钮事件
    frontEditBtn.addEventListener('click', function() {
        if (frontImage) {
            manualEditor.openEditor(frontImage, 'front', function(editedImage) {
                frontImage = editedImage;
                frontPreview.src = editedImage;
            });
        }
    });
    
    backEditBtn.addEventListener('click', function() {
        if (backImage) {
            manualEditor.openEditor(backImage, 'back', function(editedImage) {
                backImage = editedImage;
                backPreview.src = editedImage;
            });
        }
    });

    // Generate PDF with actual ID card size
    async function generatePDF() {
        if (!frontImage && !backImage) {
            alert('Please upload at least one side of the ID card.');
            return;
        }

        // 显示加载状态
        const generateBtnText = generateBtn.textContent;
        generateBtn.textContent = '处理中...';
        generateBtn.disabled = true;
        
        try {
            // 在生成 PDF 前自动检测并裁剪身份证
            let processedFrontImage = frontImage;
            let processedBackImage = backImage;
            
            // 处理正面图片
            if (frontImage) {
                try {
                    processedFrontImage = await detectorSelector.detectIDCard(frontImage);
                    // 更新预览和存储
                    if (processedFrontImage !== frontImage) {
                        frontPreview.src = processedFrontImage;
                        frontImage = processedFrontImage;
                    }
                } catch (error) {
                    console.error('正面身份证检测失败：', error);
                    // 出错时使用原始图像
                }
            }
            
            // 处理背面图片
            if (backImage) {
                try {
                    processedBackImage = await detectorSelector.detectIDCard(backImage);
                    // 更新预览和存储
                    if (processedBackImage !== backImage) {
                        backPreview.src = processedBackImage;
                        backImage = processedBackImage;
                    }
                } catch (error) {
                    console.error('背面身份证检测失败：', error);
                    // 出错时使用原始图像
                }
            }

            // Create a new jsPDF instance (A4 size)
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Calculate positions to center the ID card on A4 page
            const centerX = (A4_WIDTH - ID_CARD_WIDTH) / 2;

            // Load and place images with promises
            const promises = [];

            if (processedFrontImage) {
                promises.push(loadImage(processedFrontImage));
            }

            if (processedBackImage) {
                promises.push(loadImage(processedBackImage));
            }

            const images = await Promise.all(promises);
            
            // If both sides are uploaded, place them one above the other
            if (processedFrontImage && processedBackImage) {
                // Calculate vertical positions
                const totalHeight = ID_CARD_HEIGHT * 2 + 10; // 10mm gap between cards
                const startY = (A4_HEIGHT - totalHeight) / 2;

                // Add front image
                addImageToPDF(doc, images[0], centerX, startY);
                
                // Add back image below the front image
                addImageToPDF(doc, images[1], centerX, startY + ID_CARD_HEIGHT + 10);
            } else {
                // Only one side is uploaded, center it vertically
                const startY = (A4_HEIGHT - ID_CARD_HEIGHT) / 2;
                addImageToPDF(doc, images[0], centerX, startY);
            }

            // Generate PDF blob
            pdfBlob = doc.output('blob');
            
            // Display PDF preview
            const pdfUrl = URL.createObjectURL(pdfBlob);
            pdfPreview.src = pdfUrl;
            pdfPreview.style.display = 'block';
            pdfPreviewPlaceholder.style.display = 'none';
            
            // Enable download button
            downloadBtn.disabled = false;
        } catch (error) {
            console.error('生成 PDF 失败：', error);
            alert('生成 PDF 失败，请重试');
        } finally {
            // 恢复按钮状态
            generateBtn.textContent = generateBtnText;
            generateBtn.disabled = false;
        }
    }

    // Load image and return a promise
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // Add image to PDF with proper scaling to maintain actual ID card size
    function addImageToPDF(doc, img, x, y) {
        // Calculate scaling to maintain aspect ratio while fitting within ID card dimensions
        const imgAspect = img.width / img.height;
        const cardAspect = ID_CARD_WIDTH / ID_CARD_HEIGHT;
        
        let width, height;
        
        if (imgAspect > cardAspect) {
            // Image is wider than card proportion
            width = ID_CARD_WIDTH;
            height = width / imgAspect;
        } else {
            // Image is taller than card proportion
            height = ID_CARD_HEIGHT;
            width = height * imgAspect;
        }
        
        // Center the image within the ID card area
        const offsetX = (ID_CARD_WIDTH - width) / 2;
        const offsetY = (ID_CARD_HEIGHT - height) / 2;
        
        // Add image to PDF
        doc.addImage(
            img, 
            'JPEG', 
            x + offsetX, 
            y + offsetY, 
            width, 
            height
        );
        
        // Draw a border around the ID card area with Notion-style
        doc.setDrawColor(233, 233, 231); // Notion border color
        doc.setLineWidth(0.2);
        doc.rect(x, y, ID_CARD_WIDTH, ID_CARD_HEIGHT);
        
        // Add a subtle Notion-style watermark
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text('Generated with ID Card Scanner ✨', A4_WIDTH - 10, A4_HEIGHT - 5, { align: 'right' });
    }
});