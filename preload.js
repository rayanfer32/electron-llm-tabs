// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  switchTab: (index) => ipcRenderer.send('switch-tab', index)
});
