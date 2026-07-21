const QRCode = require('qrcode');

const urlInput = document.getElementById('url-input');
const generateBtn = document.getElementById('generate-btn');
const warning = document.getElementById('warning');

// QR image elements
const qrClassic = document.getElementById('qr-classic');
const qrNeon = document.getElementById('qr-neon');
const qrEco = document.getElementById('qr-eco');

// Download buttons
const dlClassic = document.getElementById('dl-classic');
const dlNeon = document.getElementById('dl-neon');
const dlEco = document.getElementById('dl-eco');

// Tooltip elements
const tipClassic = document.getElementById('tip-classic');
const tipNeon = document.getElementById('tip-neon');
const tipEco = document.getElementById('tip-eco');

// Design presets: each has a dark (foreground) and light (background) color
const presets = {
  classic: {
    dark: '#000000',
    light: '#ffffff',
  },
  neon: {
    dark: '#00d4ff',
    light: '#0d1117',
  },
  eco: {
    dark: '#1a5c2a',
    light: '#f5f0e8',
  },
};

const commonOptions = {
  errorCorrectionLevel: 'H',
  margin: 2,
  width: 320,
};

// Generate all three QR codes
async function generateQRCodes(text) {
  const results = await Promise.all([
    QRCode.toDataURL(text, { ...commonOptions, color: presets.classic }),
    QRCode.toDataURL(text, { ...commonOptions, color: presets.neon }),
    QRCode.toDataURL(text, { ...commonOptions, color: presets.eco }),
  ]);

  qrClassic.src = results[0];
  qrNeon.src = results[1];
  qrEco.src = results[2];

  dlClassic.disabled = false;
  dlNeon.disabled = false;
  dlEco.disabled = false;
}

// Show a temporary "Saved!" tooltip on the given element
function showTooltip(tipEl) {
  tipEl.classList.add('show');
  setTimeout(() => tipEl.classList.remove('show'), 1800);
}

// Trigger a PNG download from a data-URL
function downloadDataURL(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  a.click();
}

// Generate button click
generateBtn.addEventListener('click', async () => {
  const text = urlInput.value.trim();

  if (!text) {
    warning.style.display = 'block';
    return;
  }

  warning.style.display = 'none';

  try {
    await generateQRCodes(text);
  } catch (err) {
    console.error('QR generation error:', err);
  }
});

// Allow pressing Enter in the input to trigger generation
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generateBtn.click();
});

// Hide warning as soon as the user starts typing
urlInput.addEventListener('input', () => {
  if (urlInput.value.trim()) {
    warning.style.display = 'none';
  }
});

// Download handlers
dlClassic.addEventListener('click', () => {
  downloadDataURL(qrClassic.src, 'qr-classic.png');
  showTooltip(tipClassic);
});

dlNeon.addEventListener('click', () => {
  downloadDataURL(qrNeon.src, 'qr-neon-midnight.png');
  showTooltip(tipNeon);
});

dlEco.addEventListener('click', () => {
  downloadDataURL(qrEco.src, 'qr-eco-warm.png');
  showTooltip(tipEco);
});
