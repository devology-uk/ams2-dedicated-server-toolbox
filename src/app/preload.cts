const electron = require('electron');

interface ServerConnectionInput {
  id?: string;
  name: string;
  ipAddress: string;
  port: string;
  username: string;
  password: string;
}

electron.contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,

  // Connection management
  getConnections: () => electron.ipcRenderer.invoke('get-connections'),
  getActiveConnection: () => electron.ipcRenderer.invoke('get-active-connection'),
  saveConnection: (connection: ServerConnectionInput) => electron.ipcRenderer.invoke('save-connection', connection),
  deleteConnection: (id: string) => electron.ipcRenderer.invoke('delete-connection', id),
  setActiveConnection: (id: string | null) => electron.ipcRenderer.invoke('set-active-connection', id),

  // AMS2 API
  api: {
    testConnection: (connectionId: string) => electron.ipcRenderer.invoke('api-test-connection', connectionId),
    getTracks: (connectionId: string) => electron.ipcRenderer.invoke('api-get-tracks', connectionId),
    getVehicles: (connectionId: string) => electron.ipcRenderer.invoke('api-get-vehicles', connectionId),
    getVehicleClasses: (connectionId: string) => electron.ipcRenderer.invoke('api-get-vehicle-classes', connectionId),
    getSessionFlags: (connectionId: string) => electron.ipcRenderer.invoke('api-get-session-flags', connectionId),
    getPlayerFlags: (connectionId: string) => electron.ipcRenderer.invoke('api-get-player-flags', connectionId),
  },

  // File operations
  importConfig: () => electron.ipcRenderer.invoke('import-config'),
  exportConfig: (data: string) => electron.ipcRenderer.invoke('export-config', data),
});