import path from 'path';
import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as fs from 'fs/promises';

import isDev from './isDev.js';
import { getPreloadPath } from './pathResolver.js';
import store from './store.js';
import type { ServerConnection, ServerVersion, ServerCache } from './store.js';
import { ams2Api } from './ams2Api.js';
// import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// log.transports.file.level = 'info';
// autoUpdater.logger = log;

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

  ipcMain.handle(
    'save-connection',
    (_event, connection: Omit<ServerConnection, 'id' | 'createdAt'> & { id?: string }) => {
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
    },
  );

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

  ipcMain.handle('api-get-list-by-path', async (_event, connectionId: string, path: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getListByPath(connection, path);
  });

  ipcMain.handle('api-get-version', async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getVersion(connection);
  });

  ipcMain.handle('api-get-help', async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getHelp(connection);
  });

  ipcMain.handle('api-get-status', async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getStatus(connection);
  });

  ipcMain.handle('api-get-session-status', async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getSessionStatus(connection);
  });

  ipcMain.handle('cache-get', (_event, connectionId: string) => {
    const cache = store.get('apiCache');
    return cache[connectionId] || null;
  });

  ipcMain.handle(
    'cache-set',
    (
      _event,
      connectionId: string,
      data: { version: ServerVersion; lists: ServerCache['lists'] },
    ) => {
      const cache = store.get('apiCache');
      cache[connectionId] = {
        version: data.version,
        syncedAt: Date.now(),
        lists: data.lists,
      };
      store.set('apiCache', cache);
      return true;
    },
  );

  ipcMain.handle('cache-clear', (_event, connectionId: string) => {
    const cache = store.get('apiCache');
    delete cache[connectionId];
    store.set('apiCache', cache);
    return true;
  });

  ipcMain.handle('api-get-all-lists', async (_event, connectionId: string) => {
    const connection = getConnectionById(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }
    return ams2Api.getAllLists(connection);
  });
}

function getConnectionById(id: string): ServerConnection | null {
  const connections = store.get('connections');
  return connections.find((c: ServerConnection) => c.id === id) || null;
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const minimalMenu = Menu.buildFromTemplate([
      {
        label: app.name,
        submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }],
      },
    ]);
    Menu.setApplicationMenu(minimalMenu);
  } else {
    Menu.setApplicationMenu(null);
  }

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
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist-ui/index.html'));

    // autoUpdater.checkForUpdatesAndNotify();
  }
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
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
