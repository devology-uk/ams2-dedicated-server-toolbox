const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,

  // Connection management
  getConnections: () => electron.ipcRenderer.invoke('get-connections'),
  getActiveConnection: () => electron.ipcRenderer.invoke('get-active-connection'),
  saveConnection: (connection) => electron.ipcRenderer.invoke('save-connection', connection),
  deleteConnection: (id) => electron.ipcRenderer.invoke('delete-connection', id),
  setActiveConnection: (id) => electron.ipcRenderer.invoke('set-active-connection', id),

  // AMS2 API
  api: {
    testConnection: (connectionId) => electron.ipcRenderer.invoke('api-test-connection', connectionId),
    getTracks: (connectionId) => electron.ipcRenderer.invoke('api-get-tracks', connectionId),
    getVehicles: (connectionId) => electron.ipcRenderer.invoke('api-get-vehicles', connectionId),
    getVehicleClasses: (connectionId) => electron.ipcRenderer.invoke('api-get-vehicle-classes', connectionId),
  },

  // File operations
  importConfig: () => electron.ipcRenderer.invoke('import-config'),
  exportConfig: (data) => electron.ipcRenderer.invoke('export-config', data),
});