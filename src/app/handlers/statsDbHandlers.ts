// src/app/handlers/statsDbHandlers.ts (updated top section only)

import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import type { InsertManualResultParams } from '../../shared/types/statsDb.js';
import { getDatabase } from '../db/index.js';
import { StatsImportService } from '../services/statsImportService.js';
import { StatsQueryService } from '../services/statsQueryService.js';

function stripComments(content: string): string {
    return content
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('//'))
        .join('\n');
}

/**
 * Helper to get services, returning null if DB is unavailable.
 * This lets the app run even if SQLite failed to load (e.g.,
 * native module issue), with graceful error responses.
 */
function getServices(): {
    importService: StatsImportService;
    queryService: StatsQueryService;
} | null {
    try {
        const db = getDatabase();
        return {
            importService: new StatsImportService(db),
            queryService: new StatsQueryService(db),
        };
    } catch (error) {
        console.error('[StatsDB] Database unavailable:', error);
        return null;
    }
}

const DB_UNAVAILABLE_RESPONSE = {
    success: false,
    error: 'Stats database is not available. Check the application logs for details.',
};

export function registerStatsDbHandlers(mainWindow: BrowserWindow): void {
    // =============================================
    // Import
    // =============================================

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_IMPORT_FILE,
        async (_event, filePath?: string) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                let targetPath = filePath;

                if (!targetPath) {
                    const result = await dialog.showOpenDialog(mainWindow, {
                        title: 'Import AMS2 Stats File',
                        filters: [
                            { name: 'JSON Files', extensions: ['json'] },
                            { name: 'All Files', extensions: ['*'] },
                        ],
                        properties: ['openFile'],
                    });

                    if (result.canceled || result.filePaths.length === 0) {
                        return { success: false, error: 'No file selected' };
                    }

                    targetPath = result.filePaths[0];
                }

                const content = await fs.readFile(targetPath, 'utf-8');
                const cleanedContent = stripComments(content);

                const importResult = services.importService.importFile(
                    targetPath,
                    cleanedContent,
                );

                return {
                    success: true,
                    data: importResult,
                };
            } catch (error) {
                console.error('[StatsDB] Import failed:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Import failed',
                };
            }
        },
    );

    // =============================================
    // Servers
    // =============================================

    ipcMain.handle(IPC_CHANNELS.STATS_DB_GET_SERVERS, () => {
        const services = getServices();
        if (!services) return DB_UNAVAILABLE_RESPONSE;

        try {
            return { success: true, data: services.queryService.getServers() };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_GET_SERVER_OVERVIEW,
        (_event, serverId: number) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                return {
                    success: true,
                    data: services.queryService.getServerOverview(serverId),
                };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_DELETE_SERVER,
        (_event, serverId: number) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                services.queryService.deleteServer(serverId);
                return { success: true };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    // =============================================
    // Players
    // =============================================

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_GET_PLAYERS,
        (_event, serverId: number) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                return { success: true, data: services.queryService.getPlayers(serverId) };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_GET_PLAYER_HISTORY,
        (_event, steamId: string, serverId?: number) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                return {
                    success: true,
                    data: services.queryService.getPlayerResultHistory(steamId, serverId),
                };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_GET_PLAYER_BEST_LAPS,
        (_event, steamId: string, serverId?: number) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                return {
                    success: true,
                    data: services.queryService.getPlayerBestLaps(steamId, serverId),
                };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    // =============================================
    // Sessions
    // =============================================

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_GET_SESSIONS,
        (
            _event,
            serverId: number,
            options?: { limit?: number; offset?: number; hasResults?: boolean },
        ) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                return {
                    success: true,
                    data: services.queryService.getSessions(serverId, options),
                };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_GET_SESSION_RESULTS,
        (_event, sessionId: number) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                return {
                    success: true,
                    data: services.queryService.getAllSessionResults(sessionId),
                };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_GET_STAGE_RESULTS,
        (_event, sessionId: number, stageName: string) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                return {
                    success: true,
                    data: services.queryService.getStageResults(sessionId, stageName),
                };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    // =============================================
    // Import History
    // =============================================

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_GET_IMPORT_HISTORY,
        (_event, serverId: number, limit?: number) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                return {
                    success: true,
                    data: services.queryService.getImportHistory(serverId, limit),
                };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    // =============================================
    // Manual Results
    // =============================================

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_INSERT_MANUAL_RESULT,
        (_event, params: InsertManualResultParams) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                return {
                    success: true,
                    data: services.queryService.insertManualResult(params),
                };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );

    ipcMain.handle(
        IPC_CHANNELS.STATS_DB_DELETE_MANUAL_RESULT,
        (_event, resultId: number) => {
            const services = getServices();
            if (!services) return DB_UNAVAILABLE_RESPONSE;

            try {
                services.queryService.deleteManualResult(resultId);
                return { success: true };
            } catch (error) {
                return { success: false, error: String(error) };
            }
        },
    );
}