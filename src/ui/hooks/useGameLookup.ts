// src/ui/hooks/useGameLookup.ts

import { useEffect, useState } from 'react';

export interface GameLookup {
    resolveTrack: (id: number) => string;
    resolveVehicle: (id: number) => string;
}

// Module-level shared cache
const trackMap = new Map<number, string>();
const vehicleMap = new Map<number, string>();

// Start loading game data eagerly as soon as this module is imported.
// This runs before any component mounts, so the maps should be populated
// by the time a user actually loads a stats file or navigates to results.
const loadPromise: Promise<void> = window.electron.gameData.get().then((cache) => {
    if (cache?.lists) {
        const tracks = cache.lists['tracks']?.list;
        if (Array.isArray(tracks)) {
            for (const t of tracks) {
                if (t && typeof t.id === 'number' && typeof t.name === 'string') {
                    trackMap.set(t.id, t.name);
                }
            }
        }
        const vehicles = cache.lists['vehicles']?.list;
        if (Array.isArray(vehicles)) {
            for (const v of vehicles) {
                if (v && typeof v.id === 'number' && typeof v.name === 'string') {
                    vehicleMap.set(v.id, v.name);
                }
            }
        }
    }
    console.log(`[GameLookup] Loaded ${trackMap.size} tracks, ${vehicleMap.size} vehicles`);
}).catch((err) => {
    console.error('[GameLookup] Failed to load game data:', err);
});

export function useGameLookup(): GameLookup {
    const [, setTick] = useState(0);

    useEffect(() => {
        // If data hasn't loaded yet (e.g. very fast navigation), wait for it
        if (trackMap.size === 0) {
            loadPromise.then(() => setTick((n) => n + 1));
        }
    }, []);

    return {
        resolveTrack(id: number): string {
            const name = trackMap.get(id);
            return name ? `${name} (${id})` : String(id);
        },
        resolveVehicle(id: number): string {
            const name = vehicleMap.get(id);
            return name ? `${name} (${id})` : String(id);
        },
    };
}
