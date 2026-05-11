// src/app/handlers/pluginHandlers.ts

import { ipcMain, dialog } from 'electron';
import { existsSync, cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import type { KnownPlugin, PluginInstallResult } from '../../shared/types/api.js';

const KNOWN_PLUGINS: KnownPlugin[] = [
    {
        id: 'ams2_stats',       // matches lua-plugins/<id>/ folder name
        name: 'AMS2 Stats',
        description:
            'Enhanced race statistics that captures sector times for every lap and includes ' +
            'all drivers in results — not just those who finished. A community-focused ' +
            'alternative to the built-in sms_stats plugin.',
        addonName: 'ams2_stats', // addon folder name used by the AMS2 server (lua/<addonName>/)
        version: '1.0',
        bundled: true,
    },
];

function getBundledPluginPath(pluginId: string): string | null {
    const candidates = [
        // Packaged app: lua-plugins/ is placed in extraResources
        path.join(process.resourcesPath, 'lua-plugins', pluginId),
        // Development: project root
        path.join(process.cwd(), 'lua-plugins', pluginId),
    ];
    for (const candidate of candidates) {
        if (existsSync(candidate)) return candidate;
    }
    return null;
}

function isInstalled(pluginId: string, serverDir: string): boolean {
    const plugin = KNOWN_PLUGINS.find((p) => p.id === pluginId);
    const addonName = plugin?.addonName ?? pluginId;
    return existsSync(path.join(serverDir, 'lua', addonName));
}

export function registerPluginHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.PLUGIN_GET_KNOWN_PLUGINS, (): KnownPlugin[] => KNOWN_PLUGINS);

    ipcMain.handle(IPC_CHANNELS.PLUGIN_SELECT_SERVER_DIR, async (): Promise<string | null> => {
        const result = await dialog.showOpenDialog({
            title: 'Select AMS2 Dedicated Server Folder',
            properties: ['openDirectory'],
        });
        return result.canceled ? null : result.filePaths[0] ?? null;
    });

    ipcMain.handle(
        IPC_CHANNELS.PLUGIN_CHECK_INSTALLED,
        (_event, pluginId: string, serverDir: string): boolean =>
            isInstalled(pluginId, serverDir),
    );

    ipcMain.handle(
        IPC_CHANNELS.PLUGIN_INSTALL,
        (_event, pluginId: string, serverDir: string): PluginInstallResult => {
            try {
                const plugin = KNOWN_PLUGINS.find((p) => p.id === pluginId);
                const addonName = plugin?.addonName ?? pluginId;

                const sourcePath = getBundledPluginPath(pluginId);
                if (!sourcePath) {
                    return { success: false, error: 'Plugin source files not found in application bundle.' };
                }

                // Copy lua/<addonName>/ → <serverDir>/lua/<addonName>/
                const luaSrc  = path.join(sourcePath, 'lua', addonName);
                const luaDest = path.join(serverDir, 'lua', addonName);
                mkdirSync(luaDest, { recursive: true });
                cpSync(luaSrc, luaDest, { recursive: true });

                // Copy lua_config/ → <serverDir>/lua_config/ (merge)
                const configSrc  = path.join(sourcePath, 'lua_config');
                const configDest = path.join(serverDir, 'lua_config');
                mkdirSync(configDest, { recursive: true });
                cpSync(configSrc, configDest, { recursive: true });

                return { success: true };
            } catch (err) {
                return {
                    success: false,
                    error: err instanceof Error ? err.message : String(err),
                };
            }
        },
    );
}
