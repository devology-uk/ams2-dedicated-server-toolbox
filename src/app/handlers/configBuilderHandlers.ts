// src/app/handlers/configBuilderHandlers.ts

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import type { ServerConfig } from '../../shared/types/config.js';
import store from '../store.js';

export function registerConfigBuilderHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.CONFIG_BUILDER_GET_STATE, () => ({
    autoLoadLast: store.get('configBuilderAutoLoadLast'),
    lastConfig: store.get('configBuilderLastConfig'),
  }));

  ipcMain.handle(IPC_CHANNELS.CONFIG_BUILDER_SAVE_LAST, (_event, config: ServerConfig) => {
    store.set('configBuilderLastConfig', config);
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_BUILDER_SET_AUTO_LOAD, (_event, enabled: boolean) => {
    store.set('configBuilderAutoLoadLast', enabled);
  });
}
