// src/app/store.ts

import Store from 'electron-store';
import type {
  ServerConnection,
  ServerCache,
} from '../shared/types/connections.js';

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

// Re-export types for convenience within app folder
export type { ServerConnection, ServerCache };