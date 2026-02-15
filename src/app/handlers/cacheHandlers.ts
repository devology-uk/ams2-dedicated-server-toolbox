// src/app/handlers/cacheHandlers.ts

import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { app } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import store from '../store.js';
import type { ServerCache } from '../../shared/types/connections.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerCacheHandlers(): void {
    // =============================================
    // Existing per-connection cache (keep for API Explorer)
    // =============================================

    ipcMain.handle(IPC_CHANNELS.CACHE_GET, (_event, connectionId: string) => {
        const cache = store.get('apiCache');
        return cache[connectionId] ?? null;
    });

    ipcMain.handle(
        IPC_CHANNELS.CACHE_SET,
        (_event, connectionId: string, data: { version: unknown; lists: unknown }) => {
            const cache = store.get('apiCache');
            cache[connectionId] = { ...data, syncedAt: Date.now() } as ServerCache;
            store.set('apiCache', cache);
        },
    );

    ipcMain.handle(IPC_CHANNELS.CACHE_CLEAR, (_event, connectionId: string) => {
        const cache = store.get('apiCache');
        delete cache[connectionId];
        store.set('apiCache', cache);
    });

    // =============================================
    // Game Data — shared, connection-independent
    // =============================================

    ipcMain.handle(IPC_CHANNELS.GAME_DATA_GET, () => {
        let gameData: ServerCache | null = store.get('gameData');
        console.log('[Cache] GAME_DATA_GET called, stored gameData:', gameData ? 'exists' : 'null');

        // If no game data, try to seed from bundled defaults
        if (!gameData) {
            console.log('[Cache] No stored game data, attempting to load bundled...');
            gameData = loadBundledGameData();
            if (gameData) {
                store.set('gameData', gameData);
                store.set('gameDataVersion', 'bundled');
                console.log('[Cache] Seeded game data from bundled defaults');
            } else {
                console.log('[Cache] loadBundledGameData returned null');
            }
        }

        console.log('[Cache] Returning gameData:', gameData ? `object with ${Object.keys(gameData.lists || {}).length} lists` : 'null');
        return gameData;
    });

    ipcMain.handle(
        IPC_CHANNELS.GAME_DATA_SET,
        (_event, data: { version: unknown; lists: unknown }, version?: string) => {
            store.set('gameData', { ...data, syncedAt: Date.now() } as ServerCache);
            store.set('gameDataVersion', version ?? 'synced');
            console.log('[Cache] Game data updated:', version ?? 'synced');
        },
    );

    ipcMain.handle(IPC_CHANNELS.GAME_DATA_CLEAR, () => {
        store.set('gameData', null);
        store.set('gameDataVersion', null);
    });

    ipcMain.handle(IPC_CHANNELS.GAME_DATA_GET_VERSION, () => {
        return store.get('gameDataVersion');
    });
}

/**
 * Load bundled game data from a JSON file shipped with the app.
 * This provides defaults so Config Builder works without ever
 * connecting to a server.
 */
function loadBundledGameData(): ServerCache | null {
    try {
        // In dev: look relative to project root
        // In production: look in app resources
        const possiblePaths = [
            // Dev mode: source location
            path.join(app.getAppPath(), 'src', 'app', 'data', 'ams2-game-data.json'),
            // Dev mode: compiled output
            path.join(app.getAppPath(), 'dist-app', 'data', 'ams2-game-data.json'),
            // Production: relative to compiled main.js
            path.join(__dirname, 'data', 'ams2-game-data.json'),
            // Production: app resources
            path.join(app.getAppPath(), 'data', 'ams2-game-data.json'),
        ];

        for (const filePath of possiblePaths) {
            const exists = fs.existsSync(filePath);
            console.log(`[Cache] Checking: ${filePath} -> ${exists ? 'FOUND' : 'not found'}`);
            if (exists) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const parsed = JSON.parse(content);
                console.log('[Cache] Parsed bundled data, lists:', Object.keys(parsed.lists || {}).length);
                return parsed;
            }
        }

        console.warn('[Cache] No bundled game data file found');
        return null;
    } catch (error) {
        console.error('[Cache] Failed to load bundled game data:', error);
        return null;
    }
}