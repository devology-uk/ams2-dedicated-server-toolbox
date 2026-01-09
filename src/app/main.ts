import path from 'path';
import {app, BrowserWindow} from 'electron';

import isDev from './isDev.js';
import { getPreloadPath } from './pathResolver.js';

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if(isDev()) {
    mainWindow.loadURL('http://localhost:5173');
    return;
  }
  mainWindow.loadFile(path.join(app.getAppPath(), 'dist-ui/index.html'));
});