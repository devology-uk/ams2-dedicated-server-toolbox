// src/app/main.ts

import path from 'path';
import { app, BrowserWindow, Menu, ipcMain } from 'electron';

import isDev from './isDev.js';
import { getPreloadPath } from './pathResolver.js';
import { registerAllHandlers } from './handlers/index.js';
import { getDatabase, closeDatabase } from './db/index.js';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

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

    // Initialize database before creating window and registering handlers.
    // This ensures the schema is ready before any IPC handler tries to
    // use it. getDatabase() is idempotent — subsequent calls return the
    // same instance.
    try {
        const db = getDatabase();
        console.log('[Main] Database initialized successfully');
    } catch (error) {
        console.error('[Main] Failed to initialize database:', error);
        // App can still function for non-DB features (API Explorer, Config Builder)
        // but Stats DB features will fail gracefully via IPC error responses
    }

    const mainWindow = new BrowserWindow({
                                             width: 1280,
                                             height: 980,
                                             minWidth: 600,
                                             minHeight: 400,
                                             icon: path.join(app.getAppPath(), 'appIcon.png'),
                                             ...(process.platform === 'win32' && {
                                                 titleBarStyle: 'hidden',
                                                 titleBarOverlay: {
                                                     color: '#1e1e2e',
                                                     symbolColor: '#cdd6f4',
                                                     height: 36,
                                                 },
                                             }),
                                             webPreferences: {
                                                 preload: getPreloadPath(),
                                             },
                                         });

    registerAllHandlers(mainWindow);

    if (isDev()) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), 'dist-ui/index.html'));
    }

    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // Auto-update (production only)
    if (app.isPackaged) {
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify();

        autoUpdater.on('update-downloaded', () => {
            mainWindow.webContents.send('update-ready');
        });

        ipcMain.handle('install-update', () => {
            autoUpdater.quitAndInstall();
        });
    }
});

// Clean up database connection before the process exits.
// 'before-quit' fires before windows close, giving us a reliable
// point to flush WAL and release the file lock.
app.on('before-quit', () => {
    console.log('[Main] Closing database...');
    closeDatabase();
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