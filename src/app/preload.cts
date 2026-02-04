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
  saveConnection: (connection: ServerConnectionInput) =>
    electron.ipcRenderer.invoke('save-connection', connection),
  deleteConnection: (id: string) => electron.ipcRenderer.invoke('delete-connection', id),
  setActiveConnection: (id: string | null) =>
    electron.ipcRenderer.invoke('set-active-connection', id),

  // AMS2 API
  api: {
    testConnection: (connectionId: string) =>
      electron.ipcRenderer.invoke('api-test-connection', connectionId),
    getListByPath: (connectionId: string, path: string) =>
      electron.ipcRenderer.invoke('api-get-list-by-path', connectionId, path),
    getTracks: (connectionId: string) =>
      electron.ipcRenderer.invoke('api-get-tracks', connectionId),
    getVehicles: (connectionId: string) =>
      electron.ipcRenderer.invoke('api-get-vehicles', connectionId),
    getVehicleClasses: (connectionId: string) =>
      electron.ipcRenderer.invoke('api-get-vehicle-classes', connectionId),
    getVersion: (connectionId: string) =>
      electron.ipcRenderer.invoke('api-get-version', connectionId),
    getHelp: (connectionId: string) =>
      electron.ipcRenderer.invoke('api-get-help', connectionId),
    getStatus: (connectionId: string) =>
      electron.ipcRenderer.invoke('api-get-status', connectionId),
    getSessionStatus: (connectionId: string) =>
      electron.ipcRenderer.invoke('api-get-session-status', connectionId),
    getAllLists: (connectionId: string) =>
      electron.ipcRenderer.invoke('api-get-all-lists', connectionId),
  },

  // Cache operations
  cache: {
    get: (connectionId: string) => electron.ipcRenderer.invoke('cache-get', connectionId),
    set: (connectionId: string, data: { version: unknown; lists: unknown }) =>
      electron.ipcRenderer.invoke('cache-set', connectionId, data),
    clear: (connectionId: string) => electron.ipcRenderer.invoke('cache-clear', connectionId),
  },

  // File operations
  importConfig: () => electron.ipcRenderer.invoke('import-config'),
  exportConfig: (data: string) => electron.ipcRenderer.invoke('export-config', data),
});