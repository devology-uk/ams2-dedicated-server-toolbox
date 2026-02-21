// src/app/handlers/fileHandlers.ts

import { ipcMain, dialog, shell } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';

export function registerFileHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_URL, (_event, url: string) => {
    shell.openExternal(url);
  });


  ipcMain.handle(IPC_CHANNELS.IMPORT_CONFIG, async () => {
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

  ipcMain.handle(IPC_CHANNELS.EXPORT_CONFIG, async (_event, data: string) => {
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
      const filePath = result.filePath;
      const filename = path.basename(filePath);

      // Auto-backup existing file before overwriting (timestamped)
      try {
        await fs.access(filePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const ext = path.extname(filePath);
        const base = filePath.slice(0, -ext.length);
        const backupPath = `${base}_${timestamp}${ext}.bak`;
        await fs.copyFile(filePath, backupPath);
        console.log(`Backup created: ${backupPath}`);
      } catch {
        // File doesn't exist yet — no backup needed
      }

      await fs.writeFile(filePath, data, 'utf-8');

      return { success: true, filename };
    } catch (error) {
      console.error('Failed to write config file:', error);
      return { success: false, error: 'Failed to write configuration file' };
    }
  });
}