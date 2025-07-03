const { contextBridge, ipcRenderer } = require('electron');

console.log('🐟 Preload script starting...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Screen capture
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  
  // API key management
  storeApiKey: (apiKey: string) => ipcRenderer.invoke('store-api-key', apiKey),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  
  // Overlay management
  showOverlay: (content: string) => ipcRenderer.invoke('show-overlay', content),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),
  
  // External links
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Assistant request handling
  processAssistantRequest: (data: any) => ipcRenderer.invoke('process-assistant-request', data),
  
  // Event listeners
  onProcessAssistantRequest: (callback: (data: any) => void) => {
    ipcRenderer.on('process-assistant-request', (event: any, data: any) => callback(data));
  },
  
  onDisplayContent: (callback: (content: string) => void) => {
    ipcRenderer.on('display-content', (event: any, content: string) => callback(content));
  },
  
  onShowLoading: (callback: () => void) => {
    ipcRenderer.on('show-loading', () => callback());
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

console.log('🐟 Preload script completed - electronAPI exposed'); 