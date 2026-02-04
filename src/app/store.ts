import Store from 'electron-store';

export interface ServerConnection {
  id: string;
  name: string;
  ipAddress: string;
  port: string;
  username: string;
  password: string;
  createdAt: number;
}

export interface ServerVersion {
  build_version: number;
  protocol_version: number;
  lua_version: number;
}

export interface CachedListData {
  description: string;
  list: Record<string, unknown>[];
}

export interface ServerCache {
  version: ServerVersion;
  syncedAt: number;
  lists: {
    [path: string]: CachedListData;
  };
}

export interface StoreSchema {
  connections: ServerConnection[];
  activeConnectionId: string | null;
  apiCache: {
    [connectionId: string]: ServerCache;
  };
}

const store = new Store<StoreSchema>({
  defaults: {
    connections: [],
    activeConnectionId: null,
    apiCache: {},
  },
});

export default store;