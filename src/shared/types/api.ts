import type {
    ServerConnection,
    ServerConnectionInput,
    ServerVersion,
    CachedListData,
    AllListsData,
    ServerCache,
    Track,
    Vehicle,
    VehicleClass,
} from './connections.js';

import type {
    ImportResult,
    ServerSummary,
    ServerOverview,
    PlayerSummary,
    PlayerResultHistory,
    PlayerBestLap,
    SessionSummary,
    StageResultRow,
    ImportLogEntry,
    IpcResult,
} from './statsDb.js';

// Re-export for convenience
export type {IpcResult};

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    success: boolean;
}

export interface FileOperationResult {
    cancelled?: boolean;
    data?: string;
    error?: string;
    filename?: string;
    success: boolean;
}

// ============================================
// Stats Parse Result
// ============================================

export type StatsParseResult = {
    success: true;
    data: import('./ams2Stats.js').AMS2StatsFile;
    filePath: string;
    fileName: string;
} | {
    success: false;
    error: string;
};

export interface StatsFileUpdatedPayload {
    data: import('./ams2Stats.js').AMS2StatsFile;
    filePath: string;
}

// ============================================
// API Interfaces
// ============================================

export interface AMS2Api {
    getAllLists: (connectionId: string) => Promise<ApiResponse<AllListsData>>;
    getHelp: (connectionId: string) => Promise<ApiResponse<unknown>>;
    getListByPath: (connectionId: string, path: string) => Promise<ApiResponse<CachedListData>>;
    getSessionStatus: (connectionId: string) => Promise<ApiResponse<unknown>>;
    getStatus: (connectionId: string) => Promise<ApiResponse<unknown>>;
    getTracks: (connectionId: string) => Promise<ApiResponse<Track[]>>;
    getVehicleClasses: (connectionId: string) => Promise<ApiResponse<VehicleClass[]>>;
    getVehicles: (connectionId: string) => Promise<ApiResponse<Vehicle[]>>;
    getVersion: (connectionId: string) => Promise<ApiResponse<ServerVersion>>;
    testConnection: (connectionId: string) => Promise<ApiResponse<boolean>>;
}

export interface CacheAPI {
    clear: (connectionId: string) => Promise<boolean>;
    get: (connectionId: string) => Promise<ServerCache | null>;
    set: (connectionId: string, data: { version: ServerVersion; lists: AllListsData }) => Promise<boolean>;
}

export interface StatsAPI {
    onFileUpdated: (callback: (payload: StatsFileUpdatedPayload) => void) => () => void;
    parseFile: (filePath: string) => Promise<StatsParseResult>;
    selectFile: () => Promise<string | null>;
}

export type ApiListData = CachedListData;

// ============================================
// Main Electron API Interface
// ============================================

// src/shared/types/api.ts

export type Platform = 'aix' | 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32';

export interface GameDataAPI {
    get: () => Promise<ServerCache | null>;
    set: (data: { version: ServerVersion; lists: AllListsData }, version?: string) => Promise<void>;
    clear: () => Promise<void>;
    getVersion: () => Promise<string | null>;
}

export interface ElectronAPI {
    // AMS2 API
    api: AMS2Api;
    // Cache operations
    cache: CacheAPI;
    deleteConnection: (id: string) => Promise<boolean>;
    exportConfig: (data: string) => Promise<FileOperationResult>;
    // Game data (shared, connection-independent)
    gameData: GameDataAPI;
    getActiveConnection: () => Promise<ServerConnection | null>;
    // Connection management
    getConnections: () => Promise<ServerConnection[]>;
    // File operations
    importConfig: () => Promise<FileOperationResult>;
    platform: Platform;
    saveConnection: (connection: ServerConnectionInput) => Promise<ServerConnection>;
    setActiveConnection: (id: string | null) => Promise<boolean>;
    // Stats operations
    stats: StatsAPI;

    // Stats DB operations (persistence layer)
    statsDb: {
        importFile: (filePath?: string) => Promise<IpcResult<ImportResult>>;
        getServers: () => Promise<IpcResult<ServerSummary[]>>;
        getServerOverview: (serverId: number) => Promise<IpcResult<ServerOverview>>;
        deleteServer: (serverId: number) => Promise<IpcResult<void>>;
        getPlayers: (serverId: number) => Promise<IpcResult<PlayerSummary[]>>;
        getPlayerHistory: (
            steamId: string,
            serverId?: number,
        ) => Promise<IpcResult<PlayerResultHistory[]>>;
        getPlayerBestLaps: (
            steamId: string,
            serverId?: number,
        ) => Promise<IpcResult<PlayerBestLap[]>>;
        getSessions: (
            serverId: number,
            options?: { limit?: number; offset?: number; hasResults?: boolean },
        ) => Promise<IpcResult<SessionSummary[]>>;
        getSessionResults: (
            sessionId: number,
        ) => Promise<IpcResult<Record<string, StageResultRow[]>>>;
        getStageResults: (
            sessionId: number,
            stageName: string,
        ) => Promise<IpcResult<StageResultRow[]>>;
        getImportHistory: (
            serverId: number,
            limit?: number,
        ) => Promise<IpcResult<ImportLogEntry[]>>;
    };
}