// src/shared/types/ipc.ts

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

    // Game Data
    GAME_DATA_GET: 'game-data-get',
    GAME_DATA_SET: 'game-data-set',
    GAME_DATA_CLEAR: 'game-data-clear',
    GAME_DATA_GET_VERSION: 'game-data-get-version',

    // Files
    IMPORT_CONFIG: 'import-config',
    EXPORT_CONFIG: 'export-config',

    // Stats (existing - file-based)
    STATS_SELECT_FILE: 'stats-select-file',
    STATS_PARSE_FILE: 'stats-parse-file',
    STATS_FILE_UPDATED: 'stats-file-updated',

    // Stats DB (new - persistence layer)
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
} as const;