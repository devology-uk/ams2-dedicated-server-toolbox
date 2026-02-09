// src/app/handlers/index.ts

import { BrowserWindow } from 'electron';
import { registerConnectionHandlers } from './connectionHandlers.js';
import { registerApiHandlers } from './apiHandlers.js';
import { registerCacheHandlers } from './cacheHandlers.js';
import { registerFileHandlers } from './fileHandlers.js';
import { registerStatsHandlers } from './statsHandlers.js';

export function registerAllHandlers(mainWindow: BrowserWindow): void {
  registerConnectionHandlers();
  registerApiHandlers();
  registerCacheHandlers();
  registerFileHandlers();
  registerStatsHandlers(mainWindow);
}