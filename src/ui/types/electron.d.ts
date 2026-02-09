import type { ElectronAPI } from '../../shared/types/api';

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};