// src/app/handlers/cacheHandlers.ts

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import type { ServerVersion, AllListsData } from '../../shared/types/connections.js';
import store from '../store.js';

export function registerCacheHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.CACHE_GET, (_event, connectionId: string) => {
    const cache = store.get('apiCache');
    return cache[connectionId] || null;
  });

  ipcMain.handle(
    IPC_CHANNELS.CACHE_SET,
    (
      _event,
      connectionId: string,
      data: { version: ServerVersion; lists: AllListsData }
    ) => {
      const cache = store.get('apiCache');
      cache[connectionId] = {
        version: data.version,
        syncedAt: Date.now(),
        lists: data.lists,
      };
      store.set('apiCache', cache);
      return true;
    }
  );

  ipcMain.handle(IPC_CHANNELS.CACHE_CLEAR, (_event, connectionId: string) => {
    const cache = store.get('apiCache');
    delete cache[connectionId];
    store.set('apiCache', cache);
    return true;
  });
}