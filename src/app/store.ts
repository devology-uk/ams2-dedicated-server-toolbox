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
    // Game data — shared cache not tied to any connection
    gameData: ServerCache | null;
    gameDataVersion: string | null; // Track which build the data is from
}

const store = new Store<StoreSchema>({
                                         defaults: {
                                             connections: [],
                                             activeConnectionId: null,
                                             apiCache: {},
                                             gameData: null,
                                             gameDataVersion: null,
                                         },
                                     });

export default store;

export type { ServerConnection, ServerCache };