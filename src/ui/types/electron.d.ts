export interface ServerConnection {
  id: string;
  name: string;
  ipAddress: string;
  port: string;
  username: string;
  password: string;
  createdAt: number;
  lastUsed?: number;
}

export interface ApiResponse<T> {
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

export interface Track {
  id: number;
  name: string;
  gridsize: number;
  default_day: number;
  default_month: number;
  default_year: number;
}

export interface Vehicle {
  id: number;
  name: string;
  class?: string;
}

export interface VehicleClass {
  value: number;
  name: string;
  translated_name: string;
}

export interface ApiListData {
  description: string;
  list: Record<string, unknown>[];
}

export interface ServerVersion {
  build_version: number;
  protocol_version: number;
  lua_version: number;
}

export interface AllListsData {
  [path: string]: ApiListData;
}

export interface ServerCache {
  version: ServerVersion;
  syncedAt: number;
  lists: AllListsData;
}
export interface AMS2Api {
  testConnection: (connectionId: string) => Promise<ApiResponse<boolean>>;
  getListByPath: (connectionId: string, path: string) => Promise<ApiResponse<ApiListData>>;
  getTracks: (connectionId: string) => Promise<ApiResponse<Track[]>>;
  getVehicles: (connectionId: string) => Promise<ApiResponse<Vehicle[]>>;
  getVehicleClasses: (connectionId: string) => Promise<ApiResponse<VehicleClass[]>>;
  getVersion: (connectionId: string) => Promise<ApiResponse<ServerVersion>>;
  getHelp: (connectionId: string) => Promise<ApiResponse<unknown>>;
  getStatus: (connectionId: string) => Promise<ApiResponse<unknown>>;
  getSessionStatus: (connectionId: string) => Promise<ApiResponse<unknown>>;
  getAllLists: (connectionId: string) => Promise<ApiResponse<AllListsData>>;
}

export interface ElectronAPI {
  platform: NodeJS.Platform;
  getConnections: () => Promise<ServerConnection[]>;
  getActiveConnection: () => Promise<ServerConnection | null>;
  saveConnection: (
    connection: Omit<ServerConnection, 'id' | 'createdAt'> & { id?: string }
  ) => Promise<ServerConnection>;
  deleteConnection: (id: string) => Promise<boolean>;
  setActiveConnection: (id: string | null) => Promise<boolean>;
  api: AMS2Api;
  cache: CacheAPI;  // <-- This line
  importConfig: () => Promise<FileOperationResult>;
  exportConfig: (data: string) => Promise<FileOperationResult>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}