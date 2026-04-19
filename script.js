// Global Variables
let originalImage = null;
let removedBgImage = null;
let originalFile = null;
let currentBgColor = 'transparent';
let customBgColor = '#6366f1';
let currentTool = null;
let brushSize = 30;
let isDrawing = false;
let originalCanvas = null;
let maskCanvas = null;
let currentView = 'split';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadSection = document.getElementById('uploadSection');
const editorSection = document.getElementById('editorSection');
const originalImageEl = document.getElementById('originalImage');
const removedImageEl = document.getElementById('removedImage');
const comparisonOriginal = document.getElementById('comparisonOriginal');
const comparisonRemoved = document.getElementById('comparisonRemoved');
const loadingOverlay = document.getElementById('loadingOverlay');
const progressBar = document.getElementById('progressBar');
const loadingStatus = document.getElementById('loadingStatus');
const downloadBtn = document.getElementById('downloadBtn');
const downloadJpgBtn = document.getElementById('downloadJpgBtn');
const copyBtn = document.getElementById('copyBtn');
const newImageBtn = document.getElementById('newImageBtn');
const removeBgBtn = document.getElementById('removeBgBtn');
const urlInput = document.getElementById('urlInput');
const urlUploadBtn = document.getElementById('urlUploadBtn');
const comparisonSlider = document.getElementById('comparisonSlider');
const sliderHandle = document.getElementById('sliderHandle');
const smoothSlider = document.getElementById('smoothSlider');
const featherSlider = document.getElementById('featherSlider');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const restoreBtn = document.getElementById('restoreBtn');
const eraseBtn = document.getElementById('eraseBtn');

// Sample image URLs (placeholder images for demo)
const sampleImages = {
    person: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    car: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=400&fit=crop',
    animal: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop'
};

// Initialize Event Listeners
function initEventListeners() {
    // File Upload
    uploadArea.addEventListener('click', () => fileInput.click());
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and Drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // URL Upload
    urlUploadBtn.addEventListener('click', handleUrlUpload);
    
    // Sample Images
    document.querySelectorAll('.sample-item').forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.sample;
            loadSampleImage(type);
        });
    });
    
    // Background Options
    document.querySelectorAll('.bg-option[data-bg]').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            currentBgColor = option.dataset.bg;
            updateBackgroundColor();
        });
    });
    
    // Custom Color
    document.getElementById('customBgColor').addEventListener('input', (e) => {
        customBgColor = e.target.value;
        currentBgColor = 'custom';
        updateBackgroundColor();
    });
    
    // Sliders
    smoothSlider.addEventListener('input', updateSliderValues);
    featherSlider.addEventListener('input', updateSliderValues);
    brushSizeSlider.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
        brushSizeValue.textContent = brushSize;
    });
    
    // Tools
    restoreBtn.addEventListener('click', () => activateTool('restore'));
    eraseBtn.addEventListener('click', () => activateTool('erase'));
    
    // Action Buttons
    removeBgBtn.addEventListener('click', removeBackground);
    downloadBtn.addEventListener('click', () => downloadImage('png'));
    downloadJpgBtn.addEventListener('click', () => downloadImage('jpg'));
    copyBtn.addEventListener('click', copyToClipboard);
    newImageBtn.addEventListener('click', startNewImage);
    
    // View Toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            updateView();
        });
    });
    
    // Comparison Slider
    initComparisonSlider();
    
    // Canvas Drawing Events
    initCanvasDrawing();
}

// Handle File Selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        originalFile = file;
        processUploadedFile(file);
    }
}

// Process Uploaded File
function processUploadedFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            displayOriginalImage(img);
            showEditor();
            setTimeout(() => removeBackground(), 500);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Handle URL Upload
async function handleUrlUpload() {
    const url = urlInput.value.trim();
    if (!url) {
        alert('Please enter an image URL');
        return;
    }
    
    try {
        showLoading(true, 'Downloading image...');
        const response = await fetch(url);
        const blob = await response.blob();
        
        if (!blob.type.startsWith('image/')) {
            throw new Error('Invalid image URL');
        }
        
        originalFile = blob;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                displayOriginalImage(img);
                showEditor();
                showLoading(false);
                setTimeout(() => removeBackground(), 500);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(blob);
    } catch (error) {
        showLoading(false);
        alert('Failed to load image from URL. Please check the URL and try again.');
    }
}

// Load Sample Image
async function loadSampleImage(type) {
    const url = sampleImages[type];
    if (!url) return;
    
    try {
        showLoading(true, 'Loading sample...');
        const response = await fetch(url);
        const blob = await response.blob();
        
        originalFile = blob;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                displayOriginalImage(img);
                showEditor();
                showLoading(false);
                setTimeout(() => removeBackground(), 500);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(blob);
    } catch (error) {
        showLoading(false);
        alert('Failed to load sample image');
    }
}

// Display Original Image
function displayOriginalImage(img) {
    originalImageEl.src = img.src;
    comparisonOriginal.src = img.src;
    
    // Calculate image size
    const size = `${img.width} x ${img.height}`;
    document.getElementById('originalSize').textContent = size;
}

// Remove Background using AI
async function removeBackground() {
    if (!originalImage) return;
    
    showLoading(true, 'Initializing AI model...');
    
    try {
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0);
        
        // Convert to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        
        // Use background removal library
        loadingStatus.textContent = 'AI is analyzing the image...';
        
        const resultBlob = await window.backgroundRemoval(blob, {
            progress: (key, current, total) => {
                const percent = (current / total) * 100;
                progressBar.style.width = percent + '%';
                
                if (key === 'compute:inference') {
                    loadingStatus.textContent = 'Processing with AI...';
                } else if (key === 'download:segmentation') {
                    loadingStatus.textContent = 'Downloading model...';
                }
            },
            model: 'medium',
            output: {
                format: 'image/png',
                quality: 1
            }
        });
        
        // Load result
        const resultUrl = URL.createObjectURL(resultBlob);
        const img = new Image();
        img.onload = () => {
            removedBgImage = img;
            removedImageEl.src = resultUrl;
            comparisonRemoved.src = resultUrl;
            document.getElementById('removedSize').textContent = `${img.width} x ${img.height}`;
            
            // Initialize canvases for manual editing
            initEditCanvases();
            
            showLoading(false);
        };
        img.src = resultUrl;
        
    } catch (error) {
        console.error('Background removal failed:', error);
        showLoading(false);
        alert('Background removal failed. Please try again with a different image.');
    }
}

// Initialize Canvases for Manual Editing
function initEditCanvases() {
    originalCanvas = document.createElement('canvas');
    originalCanvas.width = removedBgImage.width;
    originalCanvas.height = removedBgImage.height;
    const ctx = originalCanvas.getContext('2d');
    ctx.drawImage(removedBgImage, 0, 0);
    
    maskCanvas = document.createElement('canvas');
    maskCanvas.width = removedBgImage.width;
    maskCanvas.height = removedBgImage.height;
}

// Canvas Drawing Events
function initCanvasDrawing() {
    removedImageEl.addEventListener('mousedown', startDrawing);
    removedImageEl.addEventListener('mousemove', draw);
    removedImageEl.addEventListener('mouseup', stopDrawing);
    removedImageEl.addEventListener('mouseleave', stopDrawing);
    
    // Touch events
    removedImageEl.addEventListener('touchstart', startDrawing);
    removedImageEl.addEventListener('touchmove', draw);
    removedImageEl.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    if (!currentTool) {
        alert('Please select a tool first (Restore or Erase)');
        return;
    }
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing || !currentTool || !removedBgImage) return;
    
    e.preventDefault();
    const rect = removedImageEl.getBoundingClientRect();
    const scaleX = removedBgImage.width / rect.width;
    const scaleY = removedBgImage.height / rect.height;
    
    let clientX, clientY;
    if (e.type === 'mousemove' || e.type === 'mousedown') {
        clientX = e.clientX;
        clientY = e.clientY;
    } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    applyBrush(x, y);
}

function stopDrawing() {
    isDrawing = false;
}

function applyBrush(x, y) {
    const ctx = originalCanvas.getContext('2d');
    const radius = brushSize / 2;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();
    
    if (currentTool === 'restore') {
        // Restore original pixels
        ctx.drawImage(originalImage, 0, 0, originalCanvas.width, originalCanvas.height);
    } else if (currentTool === 'erase') {
        // Erase pixels (make transparent)
        ctx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    }
    
    ctx.restore();
    
    // Update display
    removedImageEl.src = originalCanvas.toDataURL('image/png');
    comparisonRemoved.src = removedImageEl.src;
    removedBgImage = new Image();
    removedBgImage.src = removedImageEl.src;
}

// Activate Tool
function activateTool(tool) {
    currentTool = tool;
    
    // Update button states
    restoreBtn.classList.remove('active');
    eraseBtn.classList.remove('active');
    
    if (tool === 'restore') {
        restoreBtn.classList.add('active');
    } else if (tool === 'erase') {
        eraseBtn.classList.add('active');
    }
}

// Update Background Color
function updateBackgroundColor() {
    const preview = document.querySelector('.image-preview');
    const checkerboard = preview.querySelector('.checkerboard-bg');
    
    if (currentBgColor === 'transparent') {
        checkerboard.style.opacity = '0.3';
        preview.style.backgroundColor = '';
    } else if (currentBgColor === 'white') {
        checkerboard.style.opacity = '0';
        preview.style.backgroundColor = '#ffffff';
    } else if (currentBgColor === 'black') {
        checkerboard.style.opacity = '0';
        preview.style.backgroundColor = '#000000';
    } else if (currentBgColor === 'blue') {
        checkerboard.style.opacity = '0';
        preview.style.backgroundColor = '#3b82f6';
    } else if (currentBgColor === 'green') {
        checkerboard.style.opacity = '0';
        preview.style.backgroundColor = '#10b981';
    } else if (currentBgColor === 'gradient') {
        checkerboard.style.opacity = '0';
        preview.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (currentBgColor === 'custom') {
        checkerboard.style.opacity = '0';
        preview.style.backgroundColor = customBgColor;
    }
}

// Update Slider Values
function updateSliderValues() {
    document.getElementById('smoothValue').textContent = smoothSlider.value;
    document.getElementById('featherValue').textContent = featherSlider.value;
}

// Update View
function updateView() {
    const container = document.getElementById('comparisonContainer');
    const originalView = document.querySelector('.comparison-original');
    const removedView = document.querySelector('.comparison-removed');
    
    if (currentView === 'split') {
        container.style.display = 'block';
        originalView.style.clipPath = 'inset(0 0 0 0)';
        removedView.style.clipPath = 'inset(0 50% 0 0)';
        comparisonSlider.style.display = 'block';
    } else if (currentView === 'original') {
        container.style.display = 'block';
        originalView.style.clipPath = 'inset(0 0 0 0)';
        removedView.style.clipPath = 'inset(0 100% 0 0)';
        comparisonSlider.style.display = 'none';
    } else if (currentView === 'removed') {
        container.style.display = 'block';
        originalView.style.clipPath = 'inset(0 0 0 0)';
        removedView.style.clipPath = 'inset(0 0 0 0)';
        comparisonSlider.style.display = 'none';
    }
}

// Download Image
function downloadImage(format) {
    if (!removedBgImage) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = removedBgImage.width;
    canvas.height = removedBgImage.height;
    const ctx = canvas.getContext('2d');
    
    // Fill background
    if (format === 'jpg' || currentBgColor !== 'transparent') {
        if (currentBgColor === 'white') ctx.fillStyle = '#ffffff';
        else if (currentBgColor === 'black') ctx.fillStyle = '#000000';
        else if (currentBgColor === 'blue') ctx.fillStyle = '#3b82f6';
        else if (currentBgColor === 'green') ctx.fillStyle = '#10b981';
        else if (currentBgColor === 'custom') ctx.fillStyle = customBgColor;
        else if (currentBgColor === 'gradient') {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = '#ffffff';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw image
    ctx.drawImage(removedBgImage, 0, 0);
    
    // Download
    const link = document.createElement('a');
    link.download = `background-removed.${format}`;
    link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`, 0.95);
    link.click();
}

// Copy to Clipboard
async function copyToClipboard() {
    if (!removedBgImage) return;
    
    try {
        const canvas = document.createElement('canvas');
        canvas.width = removedBgImage.width;
        canvas.height = removedBgImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(removedBgImage, 0, 0);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        
        alert('Image copied to clipboard!');
    } catch (error) {
        alert('Failed to copy image');
    }
}

// Start New Image
function startNewImage() {
    editorSection.style.display = 'none';
    uploadSection.style.display = 'block';
    
    // Reset variables
    originalImage = null;
    removedBgImage = null;
    originalFile = null;
    fileInput.value = '';
    urlInput.value = '';
    
    // Reset view
    currentView = 'split';
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === 'split') {
            btn.classList.add('active');
        }
    });
}

// Show Editor
function showEditor() {
    uploadSection.style.display = 'none';
    editorSection.style.display = 'block';
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragging');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragging');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragging');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        originalFile = file;
        processUploadedFile(file);
    }
}

// Show/Hide Loading
function showLoading(show, status = '') {
    if (show) {
        loadingOverlay.classList.add('active');
        progressBar.style.width = '0%';
        loadingStatus.textContent = status || 'Processing...';
    } else {
        loadingOverlay.classList.remove('active');
    }
}

// Comparison Slider
function initComparisonSlider() {
    let isDragging = false;
    
    sliderHandle.addEventListener('mousedown', startDragging);
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', stopDragging);
    
    sliderHandle.addEventListener('touchstart', startDragging);
    window.addEventListener('touchmove', drag);
    window.addEventListener('touchend', stopDragging);
    
    function startDragging(e) {
        isDragging = true;
        e.preventDefault();
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const container = document.querySelector('.comparison-view');
        const rect = container.getBoundingClientRect();
        
        let clientX;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
        } else {
            clientX = e.touches[0].clientX;
        }
        
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        
        const percentage = (x / rect.width) * 100;
        comparisonSlider.style.left = percentage + '%';
        
        const removedView = document.querySelector('.comparison-removed');
        removedView.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    }
    
    function stopDragging() {
        isDragging = false;
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        navigator.clipboard.read().then(items => {
            for (const item of items) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    item.getType('image/png').then(blob => {
                        processUploadedFile(blob);
                    });
                    break;
                }
            }
        });
    }
    
    if (e.key === 'Escape' && editorSection.style.display === 'block') {
        if (currentTool) {
            activateTool(null);
        }
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    updateSliderValues();
    brushSizeValue.textContent = brushSize;
});
