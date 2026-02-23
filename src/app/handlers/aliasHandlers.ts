// src/app/handlers/aliasHandlers.ts

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import store from '../store.js';

export function registerAliasHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.ALIASES_GET_ALL, () => {
        return store.get('driverAliases');
    });

    ipcMain.handle(IPC_CHANNELS.ALIASES_SET, (_event, steamId: string, alias: string) => {
        const aliases = store.get('driverAliases');
        aliases[steamId] = alias.trim();
        store.set('driverAliases', aliases);
    });

    ipcMain.handle(IPC_CHANNELS.ALIASES_DELETE, (_event, steamId: string) => {
        const aliases = store.get('driverAliases');
        delete aliases[steamId];
        store.set('driverAliases', aliases);
    });
}
