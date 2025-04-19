const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startCapture: (settings) => ipcRenderer.invoke('start-capture', settings),
  stopCapture: () => ipcRenderer.invoke('stop-capture'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  onCaptureSuccess: (callback) => ipcRenderer.on('capture-success', callback),
  onCaptureError: (callback) => ipcRenderer.on('capture-error', callback)
});