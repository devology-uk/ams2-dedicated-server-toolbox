// src/app/handlers/index.ts

import { BrowserWindow } from 'electron';
import { registerConnectionHandlers } from './connectionHandlers.js';
import { registerApiHandlers } from './apiHandlers.js';
import { registerCacheHandlers } from './cacheHandlers.js';
import { registerFileHandlers } from './fileHandlers.js';
import { registerStatsHandlers } from './statsHandlers.js';
import { registerStatsDbHandlers } from './statsDbHandlers.js';
import { registerAliasHandlers } from './aliasHandlers.js';
import { registerWhatsNewHandler } from './whatsNewHandler.js';

export function registerAllHandlers(mainWindow: BrowserWindow): void {
    registerConnectionHandlers();
    registerApiHandlers();
    registerCacheHandlers();
    registerFileHandlers();
    registerStatsHandlers(mainWindow);
    registerStatsDbHandlers(mainWindow);
    registerAliasHandlers();
    registerWhatsNewHandler();
}