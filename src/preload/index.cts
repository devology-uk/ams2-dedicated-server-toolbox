// src/preload/index.ts

const electron = require('electron');

// Import channel constants - note: preload runs in Node context
// We'll define them inline to avoid import issues
const IPC_CHANNELS = {
  // Connections
  GET_CONNECTIONS: 'get-connections',
  GET_ACTIVE_CONNECTION: 'get-active-connection',
  SAVE_CONNECTION: 'save-connection',
  DELETE_CONNECTION: 'delete-connection',
  SET_ACTIVE_CONNECTION: 'set-active-connection',

  // API
  API_TEST_CONNECTION: 'api-test-connection',
  API_GET_TRACKS: 'api-get-tracks',
  API_GET_VEHICLES: 'api-get-vehicles',
  API_GET_VEHICLE_CLASSES: 'api-get-vehicle-classes',
  API_GET_LIST_BY_PATH: 'api-get-list-by-path',
  API_GET_VERSION: 'api-get-version',
  API_GET_HELP: 'api-get-help',
  API_GET_STATUS: 'api-get-status',
  API_GET_SESSION_STATUS: 'api-get-session-status',
  API_GET_ALL_LISTS: 'api-get-all-lists',

  // Cache
  CACHE_GET: 'cache-get',
  CACHE_SET: 'cache-set',
  CACHE_CLEAR: 'cache-clear',

  // Files
  IMPORT_CONFIG: 'import-config',
  EXPORT_CONFIG: 'export-config',

  // Stats
  STATS_SELECT_FILE: 'stats-select-file',
  STATS_PARSE_FILE: 'stats-parse-file',
  STATS_FILE_UPDATED: 'stats-file-updated',
} as const;

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
  getConnections: () => 
    electron.ipcRenderer.invoke(IPC_CHANNELS.GET_CONNECTIONS),
  getActiveConnection: () => 
    electron.ipcRenderer.invoke(IPC_CHANNELS.GET_ACTIVE_CONNECTION),
  saveConnection: (connection: ServerConnectionInput) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.SAVE_CONNECTION, connection),
  deleteConnection: (id: string) => 
    electron.ipcRenderer.invoke(IPC_CHANNELS.DELETE_CONNECTION, id),
  setActiveConnection: (id: string | null) =>
    electron.ipcRenderer.invoke(IPC_CHANNELS.SET_ACTIVE_CONNECTION, id),

  // AMS2 API
  api: {
    testConnection: (connectionId: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_TEST_CONNECTION, connectionId),
    getListByPath: (connectionId: string, path: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_GET_LIST_BY_PATH, connectionId, path),
    getTracks: (connectionId: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_GET_TRACKS, connectionId),
    getVehicles: (connectionId: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_GET_VEHICLES, connectionId),
    getVehicleClasses: (connectionId: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_GET_VEHICLE_CLASSES, connectionId),
    getVersion: (connectionId: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_GET_VERSION, connectionId),
    getHelp: (connectionId: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_GET_HELP, connectionId),
    getStatus: (connectionId: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_GET_STATUS, connectionId),
    getSessionStatus: (connectionId: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_GET_SESSION_STATUS, connectionId),
    getAllLists: (connectionId: string) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.API_GET_ALL_LISTS, connectionId),
  },

  // Cache operations
  cache: {
    get: (connectionId: string) => 
      electron.ipcRenderer.invoke(IPC_CHANNELS.CACHE_GET, connectionId),
    set: (connectionId: string, data: { version: unknown; lists: unknown }) =>
      electron.ipcRenderer.invoke(IPC_CHANNELS.CACHE_SET, connectionId, data),
    clear: (connectionId: string) => 
      electron.ipcRenderer.invoke(IPC_CHANNELS.CACHE_CLEAR, connectionId),
  },

  // File operations
  importConfig: () => 
    electron.ipcRenderer.invoke(IPC_CHANNELS.IMPORT_CONFIG),
  exportConfig: (data: string) => 
    electron.ipcRenderer.invoke(IPC_CHANNELS.EXPORT_CONFIG, data),

  // Stats operations
  stats: {
    selectFile: () => 
      electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_SELECT_FILE),
    parseFile: (filePath: string) => 
      electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_PARSE_FILE, filePath),
    onFileUpdated: (callback: (data: unknown) => void) => {
      const handler = (_event: unknown, data: unknown) => callback(data);
      electron.ipcRenderer.on(IPC_CHANNELS.STATS_FILE_UPDATED, handler);
      return () => {
        electron.ipcRenderer.removeListener(IPC_CHANNELS.STATS_FILE_UPDATED, handler);
      };
    },
  },
});