// src/app/handlers/apiHandlers.ts

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import { ams2Api } from '../ams2Api.js';
import { getConnectionById } from './connectionHandlers.js';

export function registerApiHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.API_TEST_CONNECTION, async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.testConnection(connection);
  });

  ipcMain.handle(IPC_CHANNELS.API_GET_TRACKS, async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getTracks(connection);
  });

  ipcMain.handle(IPC_CHANNELS.API_GET_VEHICLES, async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getVehicles(connection);
  });

  ipcMain.handle(IPC_CHANNELS.API_GET_VEHICLE_CLASSES, async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getVehicleClasses(connection);
  });

  ipcMain.handle(
    IPC_CHANNELS.API_GET_LIST_BY_PATH,
    async (_event, connectionId: string, path: string) => {
      const connection = getConnectionById(connectionId);
      if (!connection) {
        return { success: false, error: 'Connection not found' };
      }
      return ams2Api.getListByPath(connection, path);
    }
  );

  ipcMain.handle(IPC_CHANNELS.API_GET_VERSION, async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getVersion(connection);
  });

  ipcMain.handle(IPC_CHANNELS.API_GET_HELP, async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getHelp(connection);
  });

  ipcMain.handle(IPC_CHANNELS.API_GET_STATUS, async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getStatus(connection);
  });

  ipcMain.handle(IPC_CHANNELS.API_GET_SESSION_STATUS, async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getSessionStatus(connection);
  });

  ipcMain.handle(IPC_CHANNELS.API_GET_ALL_LISTS, async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getAllLists(connection);
  });
}