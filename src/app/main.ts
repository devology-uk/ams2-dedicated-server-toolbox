import path from 'path';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';

import isDev from './isDev.js';
import { getPreloadPath } from './pathResolver.js';
import store from './store.js';
import { ams2Api } from './ams2Api.js';
import type { ServerConnection } from './store.js';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function registerIpcHandlers() {
  // ============================================
  // Connection Management
  // ============================================

  ipcMain.handle('get-connections', () => {
    return store.get('connections');
  });

  ipcMain.handle('get-active-connection', () => {
    const activeId = store.get('activeConnectionId');
    if (!activeId) return null;

    const connections = store.get('connections');
    return connections.find((c: ServerConnection) => c.id === activeId) || null;
  });

  ipcMain.handle('save-connection', (_event, connection: Omit<ServerConnection, 'id' | 'createdAt'> & { id?: string }) => {
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
  });

  ipcMain.handle('delete-connection', (_event, id: string) => {
    const connections = store.get('connections');
    const filtered = connections.filter((c: ServerConnection) => c.id !== id);
    store.set('connections', filtered);

    if (store.get('activeConnectionId') === id) {
      store.set('activeConnectionId', filtered.length > 0 ? filtered[0].id : null);
    }

    return true;
  });

  ipcMain.handle('set-active-connection', (_event, id: string | null) => {
    store.set('activeConnectionId', id);
    return true;
  });

  // ============================================
  // AMS2 API
  // ============================================

  ipcMain.handle('api-test-connection', async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.testConnection(connection);
  });

  ipcMain.handle('api-get-tracks', async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getTracks(connection);
  });

  ipcMain.handle('api-get-vehicles', async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getVehicles(connection);
  });

  ipcMain.handle('api-get-vehicle-classes', async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getVehicleClasses(connection);
  });

  // ============================================
  // File Operations
  // ============================================

  ipcMain.handle('import-config', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import Server Configuration',
      filters: [
        { name: 'Config Files', extensions: ['cfg'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, cancelled: true };
    }

    try {
      const filePath = result.filePaths[0];
      const data = await fs.readFile(filePath, 'utf-8');
      const filename = path.basename(filePath);
      
      return { success: true, data, filename };
    } catch (error) {
      console.error('Failed to read config file:', error);
      return { success: false, error: 'Failed to read configuration file' };
    }
  });

  ipcMain.handle('export-config', async (_event, data: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Export Server Configuration',
      defaultPath: 'server.cfg',
      filters: [
        { name: 'Config Files', extensions: ['cfg'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, cancelled: true };
    }

    try {
      await fs.writeFile(result.filePath, data, 'utf-8');
      const filename = path.basename(result.filePath);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Failed to write config file:', error);
      return { success: false, error: 'Failed to write configuration file' };
    }
  });
}

function getConnectionById(id: string): ServerConnection | null {
  const connections = store.get('connections');
  return connections.find((c: ServerConnection) => c.id === id) || null;
}

app.whenReady().then(() => {
  registerIpcHandlers();

  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5173');
    return;
  }
  mainWindow.loadFile(path.join(app.getAppPath(), 'dist-ui/index.html'));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    app.whenReady();
  }
});