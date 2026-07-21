// src/app/handlers/exportPresetHandlers.ts

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/types/ipc.js';
import type { ExportPreset, ExportPresetInput } from '../../shared/types/export.js';
import store from '../store.js';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function registerExportPresetHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.EXPORT_PRESETS_GET_ALL, () => {
    return store.get('exportPresets');
  });

  ipcMain.handle(IPC_CHANNELS.EXPORT_PRESETS_SAVE, (_event, preset: ExportPresetInput) => {
    const presets = store.get('exportPresets');

    if (preset.id) {
      const index = presets.findIndex((p: ExportPreset) => p.id === preset.id);
      if (index !== -1) {
        presets[index] = { ...preset, id: preset.id };
        store.set('exportPresets', presets);
        return presets[index];
      }
    }

    const newPreset: ExportPreset = { ...preset, id: generateId() };
    presets.push(newPreset);
    store.set('exportPresets', presets);
    return newPreset;
  });

  ipcMain.handle(IPC_CHANNELS.EXPORT_PRESETS_DELETE, (_event, id: string) => {
    const presets = store.get('exportPresets');
    store.set('exportPresets', presets.filter((p: ExportPreset) => p.id !== id));
    return true;
  });
}
