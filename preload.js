const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateQR: (text, options) => ipcRenderer.invoke('qr:generate', text, options),
});
