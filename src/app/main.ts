// src/app/main.ts

import path from 'path';
import { app, BrowserWindow, Menu } from 'electron';

import isDev from './isDev.js';
import { getPreloadPath } from './pathResolver.js';
import { registerAllHandlers } from './handlers/index.js';

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

  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
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