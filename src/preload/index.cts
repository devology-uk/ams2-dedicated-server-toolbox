// src/preload/index.ts

const electron = require('electron');

// IPC channel constants duplicated from src/shared/types/ipc.ts
// The preload (.cts/CJS) cannot import from ESM modules at compile time.
// Keep these in sync with the source of truth in src/shared/types/ipc.ts
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

    // Game Data
    GAME_DATA_GET: 'game-data-get',
    GAME_DATA_SET: 'game-data-set',
    GAME_DATA_CLEAR: 'game-data-clear',
    GAME_DATA_GET_VERSION: 'game-data-get-version',

    // Files
    IMPORT_CONFIG: 'import-config',
    EXPORT_CONFIG: 'export-config',

    // Stats
    STATS_SELECT_FILE: 'stats-select-file',
    STATS_PARSE_FILE: 'stats-parse-file',
    STATS_FILE_UPDATED: 'stats-file-updated',

    // Stats DB
    STATS_DB_IMPORT_FILE: 'stats-db-import-file',
    STATS_DB_GET_SERVERS: 'stats-db-get-servers',
    STATS_DB_GET_SERVER_OVERVIEW: 'stats-db-get-server-overview',
    STATS_DB_DELETE_SERVER: 'stats-db-delete-server',
    STATS_DB_GET_PLAYERS: 'stats-db-get-players',
    STATS_DB_GET_PLAYER_HISTORY: 'stats-db-get-player-history',
    STATS_DB_GET_PLAYER_BEST_LAPS: 'stats-db-get-player-best-laps',
    STATS_DB_GET_SESSIONS: 'stats-db-get-sessions',
    STATS_DB_GET_SESSION_RESULTS: 'stats-db-get-session-results',
    STATS_DB_GET_STAGE_RESULTS: 'stats-db-get-stage-results',
    STATS_DB_GET_IMPORT_HISTORY: 'stats-db-get-import-history',

    // Auto-update
    UPDATE_READY: 'update-ready',
    INSTALL_UPDATE: 'install-update',

    // Shell
    OPEN_EXTERNAL_URL: 'open-external-url',
} as const;

interface ServerConnectionInput {
    id?: string;
    ipAddress: string;
    name: string;
    password: string;
    port: string;
    username: string;
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

    // Game data (shared cache)
    gameData: {
        get: () =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.GAME_DATA_GET),
        set: (data: { version: unknown; lists: unknown }, version?: string) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.GAME_DATA_SET, data, version),
        clear: () =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.GAME_DATA_CLEAR),
        getVersion: () =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.GAME_DATA_GET_VERSION),
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

// Stats DB operations
    statsDb: {
        importFile: (filePath?: string) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_IMPORT_FILE, filePath),
        getServers: () =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_GET_SERVERS),
        getServerOverview: (serverId: number) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_GET_SERVER_OVERVIEW, serverId),
        deleteServer: (serverId: number) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_DELETE_SERVER, serverId),
        getPlayers: (serverId: number) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_GET_PLAYERS, serverId),
        getPlayerHistory: (steamId: string, serverId?: number) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_GET_PLAYER_HISTORY, steamId, serverId),
        getPlayerBestLaps: (steamId: string, serverId?: number) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_GET_PLAYER_BEST_LAPS, steamId, serverId),
        getSessions: (serverId: number, options?: { limit?: number; offset?: number; hasResults?: boolean }) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_GET_SESSIONS, serverId, options),
        getSessionResults: (sessionId: number) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_GET_SESSION_RESULTS, sessionId),
        getStageResults: (sessionId: number, stageName: string) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_GET_STAGE_RESULTS, sessionId, stageName),
        getImportHistory: (serverId: number, limit?: number) =>
            electron.ipcRenderer.invoke(IPC_CHANNELS.STATS_DB_GET_IMPORT_HISTORY, serverId, limit),
    },

    // Shell
    openExternalUrl: (url: string) =>
        electron.ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_URL, url),

    // Auto-update
    onUpdateReady: (callback: () => void) => {
        const handler = () => callback();
        electron.ipcRenderer.on(IPC_CHANNELS.UPDATE_READY, handler);
        return () => {
            electron.ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_READY, handler);
        };
    },
    installUpdate: () =>
        electron.ipcRenderer.invoke(IPC_CHANNELS.INSTALL_UPDATE),
});