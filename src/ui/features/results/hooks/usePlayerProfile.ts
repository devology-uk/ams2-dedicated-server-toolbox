// src/ui/features/results/hooks/usePlayerProfile.ts

import { useState, useCallback } from 'react';
import type {
    PlayerResultHistory,
    PlayerBestLap,
} from '../../../../shared/types';

interface UsePlayerProfileReturn {
    history: PlayerResultHistory[];
    bestLaps: PlayerBestLap[];
    selectedSteamId: string | null;
    selectedName: string | null;
    loading: boolean;
    error: string | null;
    loadProfile: (steamId: string, name: string, serverId?: number) => Promise<void>;
    clearProfile: () => void;
}

export function usePlayerProfile(): UsePlayerProfileReturn {
    const [history, setHistory] = useState<PlayerResultHistory[]>([]);
    const [bestLaps, setBestLaps] = useState<PlayerBestLap[]>([]);
    const [selectedSteamId, setSelectedSteamId] = useState<string | null>(null);
    const [selectedName, setSelectedName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadProfile = useCallback(
        async (steamId: string, name: string, serverId?: number) => {
            setSelectedSteamId(steamId);
            setSelectedName(name);
            setLoading(true);
            setError(null);

            try {
                const [historyResult, bestLapsResult] = await Promise.all([
                                                                              window.electron.statsDb.getPlayerHistory(steamId, serverId),
                                                                              window.electron.statsDb.getPlayerBestLaps(steamId, serverId),
                                                                          ]);

                if (historyResult.success && historyResult.data) {
                    setHistory(historyResult.data);
                }

                if (bestLapsResult.success && bestLapsResult.data) {
                    setBestLaps(bestLapsResult.data);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const clearProfile = useCallback(() => {
        setSelectedSteamId(null);
        setSelectedName(null);
        setHistory([]);
        setBestLaps([]);
        setError(null);
    }, []);

    return {
        history,
        bestLaps,
        selectedSteamId,
        selectedName,
        loading,
        error,
        loadProfile,
        clearProfile,
    };
}