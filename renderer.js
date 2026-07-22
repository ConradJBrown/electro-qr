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

let lastGeneratedText = '';

function normalizeInput(rawValue) {
  const normalized = String(rawValue ?? '').normalize('NFKC').trim();
  // Remove hidden/control characters that can arrive from copy/paste.
  const withoutHidden = normalized.replace(/[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g, '');

  // If this looks like a URL, strip all whitespace to avoid wrapped-paste failures.
  const looksLikeUrl = /^(https?:\/\/|www\.)/i.test(withoutHidden);
  if (looksLikeUrl) {
    return withoutHidden.replace(/\s+/g, '');
  }

  return withoutHidden;
}

function getDownloadSiteSlug(value) {
  const normalized = normalizeInput(value);
  if (!normalized) return 'qr';

  const hasScheme = /^[a-z][a-z\d+\-.]*:\/\//i.test(normalized);
  const candidate = hasScheme ? normalized : (/^www\./i.test(normalized) ? `https://${normalized}` : null);

  if (!candidate) return 'qr';

  try {
    const hostname = new URL(candidate).hostname.toLowerCase().replace(/^www\d*\./, '');
    const firstLabel = hostname.split('.').find(Boolean) || hostname;
    const safeSlug = firstLabel
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return safeSlug || 'qr';
  } catch {
    return 'qr';
  }
}

function buildDownloadFilename(styleName) {
  const siteSlug = getDownloadSiteSlug(lastGeneratedText || urlInput.value);
  return `${siteSlug}-qr-${styleName}.png`;
}

function setCardState(kind, dataUrl) {
  if (kind === 'classic') {
    if (dataUrl) qrClassic.src = dataUrl;
    dlClassic.disabled = !dataUrl;
    return;
  }

  if (kind === 'neon') {
    if (dataUrl) qrNeon.src = dataUrl;
    dlNeon.disabled = !dataUrl;
    return;
  }

  if (dataUrl) qrEco.src = dataUrl;
  dlEco.disabled = !dataUrl;
}

// Generate all three QR codes
async function generateQRCodes(text) {
  const pngPrefix = 'data:image/png;base64,';

  const jobs = [
    ['classic', window.electronAPI.generateQR(text, { ...commonOptions, color: presets.classic })],
    ['neon', window.electronAPI.generateQR(text, { ...commonOptions, color: presets.neon })],
    ['eco', window.electronAPI.generateQR(text, { ...commonOptions, color: presets.eco })],
  ];

  const settled = await Promise.allSettled(jobs.map(([, task]) => task));
  let successCount = 0;
  const failures = [];

  settled.forEach((result, index) => {
    const kind = jobs[index][0];

    if (result.status === 'fulfilled' && typeof result.value === 'string' && result.value.startsWith(pngPrefix)) {
      setCardState(kind, result.value);
      successCount += 1;
      return;
    }

    setCardState(kind, null);
    if (result.status === 'rejected') {
      failures.push(`${kind}: ${result.reason?.message || String(result.reason)}`);
    } else {
      failures.push(`${kind}: invalid PNG data URL`);
    }
  });

  if (successCount === 0) {
    throw new Error(`All presets failed. ${failures.join(' | ')}`);
  }

  if (failures.length > 0) {
    console.warn('Some presets failed:', failures.join(' | '));
    warning.textContent = '⚠ Some style presets failed. Try again or shorten the input.';
    warning.style.display = 'block';
  }
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
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Generate button click
generateBtn.addEventListener('click', async () => {
  const text = normalizeInput(urlInput.value);

  if (!text) {
    warning.textContent = '⚠ Please enter some text before generating.';
    warning.style.display = 'block';
    return;
  }

  warning.style.display = 'none';

  try {
    await generateQRCodes(text);
    lastGeneratedText = text;
  } catch (err) {
    console.error('QR generation error:', err);
    const message = err?.message || 'Unknown error';
    warning.textContent = `⚠ Failed to generate QR codes. ${message}`;
    warning.style.display = 'block';
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
    warning.textContent = '⚠ Please enter some text before generating.';
  }
});

// Download handlers
dlClassic.addEventListener('click', () => {
  downloadDataURL(qrClassic.src, buildDownloadFilename('classic'));
  showTooltip(tipClassic);
});

dlNeon.addEventListener('click', () => {
  downloadDataURL(qrNeon.src, buildDownloadFilename('neon-midnight'));
  showTooltip(tipNeon);
});

dlEco.addEventListener('click', () => {
  downloadDataURL(qrEco.src, buildDownloadFilename('eco-warm'));
  showTooltip(tipEco);
});
