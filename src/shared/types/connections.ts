// src/shared/types/connections.ts

// ============================================
// Server Connection Types
// ============================================

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

export interface ServerConnectionInput {
  id?: string;
  name: string;
  ipAddress: string;
  port: string;
  username: string;
  password: string;
}

// ============================================
// Server Version & Cache Types
// ============================================

export interface ServerVersion {
  build_version: number;
  protocol_version: number;
  lua_version: number;
}

export interface CachedListData {
  description: string;
  list: Record<string, unknown>[];
}

export interface AllListsData {
  [path: string]: CachedListData;
}

export interface ServerCache {
  version: ServerVersion;
  syncedAt: number;
  lists: AllListsData;
}

// ============================================
// Game Data Types
// ============================================

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