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

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FileOperationResult {
  success: boolean;
  cancelled?: boolean;
  data?: string;
  filename?: string;
  error?: string;
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
  testConnection: (connectionId: string) => Promise<ApiResponse<boolean>>;
  getListByPath: (connectionId: string, path: string) => Promise<ApiResponse<CachedListData>>;
  getTracks: (connectionId: string) => Promise<ApiResponse<Track[]>>;
  getVehicles: (connectionId: string) => Promise<ApiResponse<Vehicle[]>>;
  getVehicleClasses: (connectionId: string) => Promise<ApiResponse<VehicleClass[]>>;
  getVersion: (connectionId: string) => Promise<ApiResponse<ServerVersion>>;
  getHelp: (connectionId: string) => Promise<ApiResponse<unknown>>;
  getStatus: (connectionId: string) => Promise<ApiResponse<unknown>>;
  getSessionStatus: (connectionId: string) => Promise<ApiResponse<unknown>>;
  getAllLists: (connectionId: string) => Promise<ApiResponse<AllListsData>>;
}

export interface CacheAPI {
  get: (connectionId: string) => Promise<ServerCache | null>;
  set: (connectionId: string, data: { version: ServerVersion; lists: AllListsData }) => Promise<boolean>;
  clear: (connectionId: string) => Promise<boolean>;
}

export interface StatsAPI {
  selectFile: () => Promise<string | null>;
  parseFile: (filePath: string) => Promise<StatsParseResult>;
  onFileUpdated: (callback: (payload: StatsFileUpdatedPayload) => void) => () => void;
}


export type ApiListData = CachedListData;

// ============================================
// Main Electron API Interface
// ============================================

// src/shared/types/api.ts

export type Platform = 'aix' | 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32';

export interface ElectronAPI {
  platform: Platform;
  
  // Connection management
  getConnections: () => Promise<ServerConnection[]>;
  getActiveConnection: () => Promise<ServerConnection | null>;
  saveConnection: (connection: ServerConnectionInput) => Promise<ServerConnection>;
  deleteConnection: (id: string) => Promise<boolean>;
  setActiveConnection: (id: string | null) => Promise<boolean>;
  
  // AMS2 API
  api: AMS2Api;
  
  // Cache operations
  cache: CacheAPI;
  
  // File operations
  importConfig: () => Promise<FileOperationResult>;
  exportConfig: (data: string) => Promise<FileOperationResult>;
  
  // Stats operations
  stats: StatsAPI;
}