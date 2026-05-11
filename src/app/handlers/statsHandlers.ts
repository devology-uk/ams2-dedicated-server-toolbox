// src/app/handlers/statsHandlers.ts

import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';

function stripComments(content: string): string {
  return content
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n');
}

function detectFormat(data: unknown): 'sms_stats' | 'ams2_stats' | 'unknown' {
  if (data === null || typeof data !== 'object') return 'unknown';
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.sessions) && d.meta && typeof (d.meta as Record<string, unknown>).plugin_version === 'string') {
    return 'ams2_stats';
  }
  if (d.stats && typeof d.stats === 'object' && Array.isArray((d.stats as Record<string, unknown>).history)) {
    return 'sms_stats';
  }
  return 'unknown';
}

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
      const cleanedContent = stripComments(content);
      const data = JSON.parse(cleanedContent);

      const format = detectFormat(data);
      if (format === 'unknown') {
        return { success: false, error: 'Unrecognised stats file format. Expected sms_stats or ams2_stats output.' };
      }

      return {
        success: true,
        format,
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