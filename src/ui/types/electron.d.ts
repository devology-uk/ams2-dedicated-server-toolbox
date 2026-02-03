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

export interface AMS2Api {
  testConnection: (connectionId: string) => Promise<ApiResponse<boolean>>;
  getTracks: (connectionId: string) => Promise<ApiResponse<Track[]>>;
  getVehicles: (connectionId: string) => Promise<ApiResponse<Vehicle[]>>;
  getVehicleClasses: (connectionId: string) => Promise<ApiResponse<VehicleClass[]>>;
}

export interface ElectronAPI {
  platform: NodeJS.Platform;
  getConnections: () => Promise<ServerConnection[]>;
  getActiveConnection: () => Promise<ServerConnection | null>;
  saveConnection: (connection: Omit<ServerConnection, 'id' | 'createdAt'> & { id?: string }) => Promise<ServerConnection>;
  deleteConnection: (id: string) => Promise<boolean>;
  setActiveConnection: (id: string | null) => Promise<boolean>;
  api: AMS2Api;
  importConfig: () => Promise<FileOperationResult>;
  exportConfig: (data: string) => Promise<FileOperationResult>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}