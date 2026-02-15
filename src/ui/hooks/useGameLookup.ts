// src/ui/hooks/useGameLookup.ts

import { useMemo } from 'react';
import { useServerCache } from '../features/config-builder/hooks/useServerCache';

export interface GameLookup {
    resolveTrack: (id: number) => string;
    resolveVehicle: (id: number) => string;
}

export function useGameLookup(): GameLookup {
    const { getTracks, getVehicles } = useServerCache();

    const trackMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const track of getTracks()) {
            map.set(track.id, track.name);
        }
        return map;
    }, [getTracks]);

    const vehicleMap = useMemo(() => {
        const map = new Map<number, string>();
        for (const vehicle of getVehicles()) {
            map.set(vehicle.id, vehicle.name);
        }
        return map;
    }, [getVehicles]);

    const resolveTrack = useMemo(
        () => (id: number): string => {
            const name = trackMap.get(id);
            return name ? `${name} (${id})` : String(id);
        },
        [trackMap],
    );

    const resolveVehicle = useMemo(
        () => (id: number): string => {
            const name = vehicleMap.get(id);
            return name ? `${name} (${id})` : String(id);
        },
        [vehicleMap],
    );

    return { resolveTrack, resolveVehicle };
}
