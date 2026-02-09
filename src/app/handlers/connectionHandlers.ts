// src/app/handlers/connectionHandlers.ts

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import type { ServerConnection, ServerConnectionInput } from '../../shared/types/connections.js';
import store from '../store.js';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function registerConnectionHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.GET_CONNECTIONS, () => {
    return store.get('connections');
  });

  ipcMain.handle(IPC_CHANNELS.GET_ACTIVE_CONNECTION, () => {
    const activeId = store.get('activeConnectionId');
    if (!activeId) return null;

    const connections = store.get('connections');
    return connections.find((c: ServerConnection) => c.id === activeId) || null;
  });

  ipcMain.handle(
    IPC_CHANNELS.SAVE_CONNECTION,
    (_event, connection: ServerConnectionInput) => {
      const connections = store.get('connections');

      if (connection.id) {
        const index = connections.findIndex((c: ServerConnection) => c.id === connection.id);
        if (index !== -1) {
          connections[index] = {
            ...connections[index],
            ...connection,
          };
          store.set('connections', connections);
          return connections[index];
        }
      }

      const newConnection: ServerConnection = {
        ...connection,
        id: generateId(),
        createdAt: Date.now(),
      };
      connections.push(newConnection);
      store.set('connections', connections);

      if (connections.length === 1) {
        store.set('activeConnectionId', newConnection.id);
      }

      return newConnection;
    }
  );

  ipcMain.handle(IPC_CHANNELS.DELETE_CONNECTION, (_event, id: string) => {
    const connections = store.get('connections');
    const filtered = connections.filter((c: ServerConnection) => c.id !== id);
    store.set('connections', filtered);

    if (store.get('activeConnectionId') === id) {
      store.set('activeConnectionId', filtered.length > 0 ? filtered[0].id : null);
    }

    return true;
  });

  ipcMain.handle(IPC_CHANNELS.SET_ACTIVE_CONNECTION, (_event, id: string | null) => {
    store.set('activeConnectionId', id);
    return true;
  });
}

export function getConnectionById(id: string): ServerConnection | null {
  const connections = store.get('connections');
  return connections.find((c: ServerConnection) => c.id === id) || null;
}