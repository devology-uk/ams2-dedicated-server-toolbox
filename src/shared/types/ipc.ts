// src/shared/types/ipc.ts

// ============================================
// IPC Channel Constants
// ============================================

export const IPC_CHANNELS = {
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

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];