// src/ui/features/config-builder/hooks/useServerCache.ts

import { useState, useEffect, useCallback } from 'react';
import type {
    Track,
    Vehicle,
    VehicleClass,
    ServerCache,
    ApiListData,
} from '../../../types/electron';
import type {
    AttributeDefinition,
    EnumItem,
    FlagItem,
} from '../../../../shared/types/config';

export interface UseServerCacheResult {
    cache: ServerCache | null;
    isLoading: boolean;
    error: string | null;

    // Convenience accessors
    getList: (path: string) => ApiListData | null;
    getSessionAttributes: () => AttributeDefinition[];
    getEnum: (name: string) => EnumItem[];
    getFlags: (name: string) => FlagItem[];
    getTracks: () => Track[];
    getVehicles: () => Vehicle[];
    getVehicleClasses: () => VehicleClass[];

    // Refresh
    refresh: () => Promise<void>;
}

export function useServerCache(): UseServerCacheResult {
    const [cache, setCache] = useState<ServerCache | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCache = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await window.electron.gameData.get();

            if (!result) {
                setError(
                    'No game data available. Use the API Explorer to sync data from a running server, ' +
                    'or ensure the bundled game data file is present.',
                );
                setCache(null);
            } else {
                setCache(result as ServerCache);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load game data');
            setCache(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCache();
    }, [loadCache]);

    const getList = useCallback(
        (path: string): ApiListData | null => {
            return cache?.lists?.[path] ?? null;
        },
        [cache],
    );

    const getSessionAttributes = useCallback((): AttributeDefinition[] => {
        const data = getList('attributes/session');
        return (data?.list as unknown as AttributeDefinition[]) ?? [];
    }, [getList]);

    const getEnum = useCallback(
        (name: string): EnumItem[] => {
            const data = getList(`enums/${name}`) ?? getList(name);
            return (data?.list as unknown as EnumItem[]) ?? [];
        },
        [getList],
    );

    const getFlags = useCallback(
        (name: string): FlagItem[] => {
            const data = getList(`flags/${name}`);
            return (data?.list as unknown as FlagItem[]) ?? [];
        },
        [getList],
    );

    const getTracks = useCallback((): Track[] => {
        const data = getList('tracks');
        return (data?.list as unknown as Track[]) ?? [];
    }, [getList]);

    const getVehicles = useCallback((): Vehicle[] => {
        const data = getList('vehicles');
        return (data?.list as unknown as Vehicle[]) ?? [];
    }, [getList]);

    const getVehicleClasses = useCallback((): VehicleClass[] => {
        const data = getList('vehicle_classes');
        return (data?.list as unknown as VehicleClass[]) ?? [];
    }, [getList]);

    return {
        cache,
        isLoading,
        error,
        getList,
        getSessionAttributes,
        getEnum,
        getFlags,
        getTracks,
        getVehicles,
        getVehicleClasses,
        refresh: loadCache,
    };
}