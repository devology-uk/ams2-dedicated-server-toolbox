// src/ui/types/electron.d.ts

import type { ElectronAPI, ApiListData } from '../../shared/types/api';

export type { ApiListData };
export type {
    ServerCache,
    Track,
    Vehicle,
    VehicleClass,
} from '../../shared/types/connections';

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}