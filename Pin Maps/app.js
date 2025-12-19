// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const targetImage = document.getElementById('targetImage');
const imageContainer = document.getElementById('imageContainer');
const emptyState = document.getElementById('emptyState');
const pinsLayer = document.getElementById('pinsLayer');
const clearPinsBtn = document.getElementById('clearPins');
const undoPinBtn = document.getElementById('undoPin');
const exportImageBtn = document.getElementById('exportImage');

// State
let pins = []; // Array of objects {x: %, y: %}
let originalImageFile = null;

// Event Listeners
imageUpload.addEventListener('change', handleImageUpload);
imageContainer.addEventListener('click', handleImageClick);
clearPinsBtn.addEventListener('click', clearAllPins);
undoPinBtn.addEventListener('click', undoLastPin);
exportImageBtn.addEventListener('click', exportFinalImage);

// 1. Image Upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    originalImageFile = file;
    const reader = new FileReader();

    reader.onload = function (event) {
        targetImage.src = event.target.result;
        targetImage.onload = () => {
            resetState();
            showImage();
        }
    };

    reader.readAsDataURL(file);
}

function showImage() {
    emptyState.classList.add('hidden');
    imageContainer.classList.remove('hidden');
    enableControls(true);
}

function resetState() {
    pins = [];
    renderPins();
}

function enableControls(enabled) {
    // Enable/disable buttons based on state
    // We update this dynamically based on pins count usually
    // But export should certainly be enabled if an image is there
    exportImageBtn.disabled = !enabled;
    updatePinButtonsState();
}

// 2. Pin Logic
function handleImageClick(e) {
    // Important: We need coordinates relative to the IMAGE, not the screen
    // The image might be scaled by CSS.
    // getBoundingClientRect gives us the current dimensions on screen.

    const rect = targetImage.getBoundingClientRect();

    // Calculate click position relative to the image
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is within bounds (should be, but just in case of padding/margin issues)
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

    // Convert to percentage
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    addPin(xPercent, yPercent);
}

function addPin(x, y) {
    pins.push({ x, y });
    renderPins();
    updatePinButtonsState();
}

function renderPins() {
    pinsLayer.innerHTML = '';
    pins.forEach((pin, index) => {
        const pinEl = document.createElement('div');
        pinEl.className = 'pin';
        pinEl.style.left = `${pin.x}%`;
        pinEl.style.top = `${pin.y}%`;
        pinEl.innerText = index + 1; // Add number
        pinsLayer.appendChild(pinEl);
    });
}

function undoLastPin() {
    if (pins.length === 0) return;
    pins.pop();
    renderPins();
    updatePinButtonsState();
}

function clearAllPins() {
    if (!confirm('¿Estás seguro de que quieres borrar todos los pines?')) return;
    pins = [];
    renderPins();
    updatePinButtonsState();
}

function updatePinButtonsState() {
    const hasPins = pins.length > 0;
    clearPinsBtn.disabled = !hasPins;
    undoPinBtn.disabled = !hasPins;
}

// 3. Export Logic (High Resolution)
function exportFinalImage() {
    if (!targetImage.src) return;

    // Create a canvas with the dimensions of the ORIGINAL NATURAL image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const naturalWidth = targetImage.naturalWidth;
    const naturalHeight = targetImage.naturalHeight;

    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    // Draw the image first
    ctx.drawImage(targetImage, 0, 0, naturalWidth, naturalHeight);

    // Draw Pins
    // We need to scale the pin size appropriate to the image size
    // A fixed pixel size (e.g. 20px) might look tiny on a 4k image.
    // Let's define a base pin radius relative to the image size e.g. 1% of width?
    // Or just fetch the user's preference? The prompt asked for "a red circle with white border".
    // I'll stick to a reasonable relative size or a fixed visible size.
    // Let's use 1.5% of the shortest dimension to keep it visible but not overwhelming.

    const pinRadius = Math.max(naturalWidth, naturalHeight) * 0.012;
    const borderWidth = pinRadius * 0.25;
    const fontSize = pinRadius * 1.2; // Adjust font size relative to pin

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    pins.forEach((pin, index) => {
        const xPx = (pin.x / 100) * naturalWidth;
        const yPx = (pin.y / 100) * naturalHeight;

        // Draw Circle
        ctx.beginPath();
        ctx.arc(xPx, yPx, pinRadius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444'; // Red
        ctx.fill();
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = '#ffffff'; // White
        ctx.stroke();

        // Draw Number
        ctx.fillStyle = '#ffffff';
        ctx.fillText(index + 1, xPx, yPx);
    });

    // Trigger Download
    const dataLink = canvas.toDataURL('image/png'); // Ensuring PNG
    const link = document.createElement('a');
    link.download = 'mapa_con_pines_numerados.png';
    link.href = dataLink;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
