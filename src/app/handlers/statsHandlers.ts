// src/app/handlers/statsHandlers.ts

import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';

export function registerStatsHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.STATS_SELECT_FILE, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select AMS2 Stats File',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.STATS_PARSE_FILE, async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      return {
        success: true,
        data,
        filePath,
        fileName: path.basename(filePath),
      };
    } catch (error) {
      console.error('Failed to parse stats file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse stats file',
      };
    }
  });
}