const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const QRCode = require('qrcode');

const isDebug = process.env.ELECTRO_QR_DEBUG === '1';

function log(level, message, extra) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level}]`;
  if (extra !== undefined) {
    console.log(prefix, message, extra);
    return;
  }
  console.log(prefix, message);
}

function wireMainProcessDiagnostics() {
  process.on('uncaughtException', (err) => {
    log('FATAL', 'Uncaught exception in main process', err?.stack || err);
  });

  process.on('unhandledRejection', (reason) => {
    log('FATAL', 'Unhandled promise rejection in main process', reason);
  });

  app.on('render-process-gone', (_event, webContents, details) => {
    log('ERROR', 'Renderer process exited unexpectedly', {
      reason: details.reason,
      exitCode: details.exitCode,
      url: webContents.getURL(),
    });
  });

  app.on('child-process-gone', (_event, details) => {
    log('WARN', 'Child process exited', details);
  });

  app.on('gpu-process-crashed', (_event, killed) => {
    log('ERROR', 'GPU process crashed', { killed });
  });
}

function wireWindowDiagnostics(win) {
  win.webContents.on('console-message', (_event, levelOrDetails, message, line, sourceId) => {
    // Electron versions differ in this event signature. Support both forms.
    if (typeof levelOrDetails === 'object' && levelOrDetails !== null) {
      log('RENDERER', `[L${levelOrDetails.level}] ${levelOrDetails.message}`, {
        sourceId: levelOrDetails.sourceId,
        line: levelOrDetails.lineNumber,
      });
      return;
    }

    log('RENDERER', `[L${levelOrDetails}] ${message}`, {
      sourceId,
      line,
    });
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    log('ERROR', 'Failed to load content', {
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame,
    });
  });

  win.webContents.on('did-finish-load', () => {
    log('INFO', 'Window content loaded', win.webContents.getURL());
  });

  win.on('unresponsive', () => {
    log('WARN', 'Window became unresponsive');
  });

  win.on('responsive', () => {
    log('INFO', 'Window responsive again');
  });

  win.on('closed', () => {
    log('INFO', 'Window closed');
  });

  if (isDebug) {
    win.webContents.openDevTools({ mode: 'detach' });
    log('INFO', 'Debug mode active: opened renderer DevTools');
  }
}

function sanitizeForQR(value) {
  const normalized = String(value ?? '').normalize('NFKC');
  return normalized.replace(/[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g, '').trim();
}

function wireIpcHandlers() {
  ipcMain.handle('qr:generate', async (_event, text, options) => {
    const safeText = sanitizeForQR(text);
    if (!safeText) {
      throw new Error('Input was empty after sanitization.');
    }

    try {
      return await QRCode.toDataURL(safeText, options);
    } catch (err) {
      const message = err?.message || String(err);
      throw new Error(`QR generation failed: ${message}`);
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  wireWindowDiagnostics(win);
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  wireMainProcessDiagnostics();
  wireIpcHandlers();
  log('INFO', `App ready (debug=${isDebug ? 'on' : 'off'})`);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log('INFO', 'All windows closed');
  if (process.platform !== 'darwin') {
    log('INFO', 'Quitting app (non-macOS behavior)');
    app.quit();
  }
});
