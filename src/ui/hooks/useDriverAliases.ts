// src/ui/hooks/useDriverAliases.ts
//
// Module-level eager-load pattern (same as useGameLookup).
// The alias map is loaded once at bundle import time so every component
// that calls this hook sees the same populated map without race conditions.

import { useState, useEffect, useCallback } from 'react';

// Module-level shared state
const aliasMap = new Map<string, string>();
let isLoaded = false;

// Pub-sub: every mounted hook instance registers here so ALL consumers
// re-render when any alias is changed, not just the one that called setAlias.
const subscribers = new Set<() => void>();
function notifyAll() {
    for (const sub of subscribers) sub();
}

const loadPromise: Promise<void> = window.electron.aliases
    .getAll()
    .then((data) => {
        for (const [steamId, alias] of Object.entries(data)) {
            aliasMap.set(steamId, alias);
        }
        isLoaded = true;
        notifyAll();
    })
    .catch((err) => console.error('[DriverAliases] Failed to load:', err));

// ----------------------------------------------------------------

export interface DriverAliases {
    /** Return alias for steamId if set, otherwise the fallback name. */
    resolveAlias: (steamId: string | null | undefined, fallback: string) => string;
    /** Return the raw alias string for a steamId, or undefined if none. */
    getAlias: (steamId: string | null | undefined) => string | undefined;
    /** Persist a new alias (IPC + local map). */
    setAlias: (steamId: string, alias: string) => Promise<void>;
    /** Remove an alias (IPC + local map). */
    deleteAlias: (steamId: string) => Promise<void>;
    /**
     * Increments whenever any alias is added, changed, or removed.
     * Use as a useMemo dependency so derived data (e.g. DataTable value arrays)
     * recomputes and forces PrimeReact to re-render body templates.
     */
    aliasVersion: number;
}

export function useDriverAliases(): DriverAliases {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        // Register this instance as a subscriber so it re-renders on any alias change
        const forceUpdate = () => setTick((n) => n + 1);
        subscribers.add(forceUpdate);

        // If data wasn't ready yet, wait for the initial load
        if (!isLoaded) {
            loadPromise.then(forceUpdate);
        }

        return () => { subscribers.delete(forceUpdate); };
    }, []);

    const resolveAlias = useCallback(
        (steamId: string | null | undefined, fallback: string): string => {
            if (steamId && aliasMap.has(steamId)) return aliasMap.get(steamId)!;
            return fallback;
        },
        [],
    );

    const getAlias = useCallback(
        (steamId: string | null | undefined): string | undefined => {
            if (!steamId) return undefined;
            return aliasMap.get(steamId);
        },
        [],
    );

    const setAlias = useCallback(async (steamId: string, alias: string): Promise<void> => {
        await window.electron.aliases.set(steamId, alias);
        aliasMap.set(steamId, alias);
        notifyAll(); // re-render every component using this hook
    }, []);

    const deleteAlias = useCallback(async (steamId: string): Promise<void> => {
        await window.electron.aliases.delete(steamId);
        aliasMap.delete(steamId);
        notifyAll(); // re-render every component using this hook
    }, []);

    return { resolveAlias, getAlias, setAlias, deleteAlias, aliasVersion: tick };
}
