// src/app/handlers/whatsNewHandler.ts

import { ipcMain, app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import store from '../store.js';

function getChangelogPath(): string {
    // In production, CHANGELOG.md is placed in extraResources (process.resourcesPath).
    // In development, it lives at the repo root alongside package.json.
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'CHANGELOG.md');
    }
    return path.join(app.getAppPath(), 'CHANGELOG.md');
}

/**
 * Parse the changelog and return markdown sections for all versions
 * newer than `sinceVersion` (exclusive), up to and including `currentVersion`.
 *
 * Changelog sections are ordered newest-first. We collect from the top
 * until we hit `sinceVersion` (or run out of sections).
 */
function extractNewSections(changelog: string, sinceVersion: string): string {
    // Split into per-version blocks. Each starts with "## ["
    const sectionRegex = /^## \[/m;
    const rawSections = changelog.split(sectionRegex).slice(1); // drop preamble

    const collected: string[] = [];

    for (const raw of rawSections) {
        const versionMatch = raw.match(/^(\d+\.\d+\.\d+)\]/);
        if (!versionMatch) continue;

        const ver = versionMatch[1];

        // Stop when we reach the version they already saw
        if (ver === sinceVersion) break;

        // Skip [Unreleased] and any malformed headers
        collected.push(`## [${raw.trimEnd()}`);
    }

    return collected.join('\n\n');
}

export function registerWhatsNewHandler(): void {
    ipcMain.handle(IPC_CHANNELS.WHATS_NEW_GET, async () => {
        const currentVersion = app.getVersion();
        const lastSeen = store.get('lastSeenVersion');

        // First install: silently record the version without showing the dialog
        if (lastSeen === null) {
            store.set('lastSeenVersion', currentVersion);
            return null;
        }

        // Already up to date
        if (lastSeen === currentVersion) {
            return null;
        }

        // New version — read and parse the changelog
        try {
            const changelog = await fs.readFile(getChangelogPath(), 'utf-8');
            const markdown = extractNewSections(changelog, lastSeen);

            return {
                currentVersion,
                markdown: markdown || `Version ${currentVersion}`,
            };
        } catch (error) {
            console.error('[WhatsNew] Failed to read changelog:', error);
            // Fall back to a minimal message so the dialog still shows
            return {
                currentVersion,
                markdown: `Updated to version ${currentVersion}.`,
            };
        }
    });

    ipcMain.handle(IPC_CHANNELS.WHATS_NEW_DISMISS, () => {
        store.set('lastSeenVersion', app.getVersion());
    });
}
