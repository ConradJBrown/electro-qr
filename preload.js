const { contextBridge } = require('electron');
const QRCode = require('qrcode');

contextBridge.exposeInMainWorld('electronAPI', {
  generateQR: (text, options) => QRCode.toDataURL(text, options),
});
