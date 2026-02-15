// src/ui/features/results/hooks/useResults.ts

import { useState, useCallback } from 'react';
import type {
    StageResultRow,
} from '../../../../shared/types';

export interface StageListItem {
    sessionId: number;
    sessionIndex: number;
    startTime: number;
    endTime: number | null;
    trackId: number;
    vehicleModelId: number;
    stageName: string;
    participantCount: number;
    finished: boolean;
}

interface UseResultsReturn {
    stages: StageListItem[];
    selectedStageResults: StageResultRow[];
    selectedStage: StageListItem | null;
    allSessionResults: Record<string, StageResultRow[]> | null;
    loading: boolean;
    loadingResults: boolean;
    error: string | null;
    fetchSessions: (
        serverId: number,
        options?: { limit?: number; offset?: number; hasResults?: boolean },
    ) => Promise<void>;
    selectStage: (stage: StageListItem) => Promise<void>;
    fetchAllSessionResults: (sessionId: number) => Promise<void>;
    clearSelection: () => void;
}

export function useResults(): UseResultsReturn {
    const [stages, setStages] = useState<StageListItem[]>([]);
    const [selectedStage, setSelectedStage] = useState<StageListItem | null>(null);
    const [selectedStageResults, setSelectedStageResults] = useState<StageResultRow[]>([]);
    const [allSessionResults, setAllSessionResults] = useState<Record<string, StageResultRow[]> | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = useCallback(
        async (
            serverId: number,
            options?: { limit?: number; offset?: number; hasResults?: boolean },
        ) => {
            setLoading(true);
            setError(null);
            try {
                const result = await window.electron.statsDb.getSessions(
                    serverId,
                    options ?? { hasResults: true, limit: 100 },
                );

                if (result.success && result.data) {
                    // Flatten sessions into stage-level rows
                    const stageItems: StageListItem[] = [];

                    for (const session of result.data) {
                        for (const stageName of session.stageNames) {
                            stageItems.push({
                                                sessionId: session.id,
                                                sessionIndex: session.sessionIndex,
                                                startTime: session.startTime,
                                                endTime: session.endTime,
                                                trackId: session.trackId,
                                                vehicleModelId: session.vehicleModelId,
                                                stageName,
                                                participantCount: session.participantCount,
                                                finished: session.finished,
                                            });
                        }
                    }

                    // Sort by start time descending, then stage name
                    stageItems.sort((a, b) => {
                        const timeDiff = b.startTime - a.startTime;
                        if (timeDiff !== 0) return timeDiff;
                        return a.stageName.localeCompare(b.stageName);
                    });

                    setStages(stageItems);
                } else {
                    setError(result.error ?? 'Failed to load sessions');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const selectStage = useCallback(async (stage: StageListItem) => {
        setSelectedStage(stage);
        setLoadingResults(true);
        setError(null);

        try {
            const result = await window.electron.statsDb.getStageResults(
                stage.sessionId,
                stage.stageName,
            );

            if (result.success && result.data) {
                setSelectedStageResults(result.data);
            } else {
                setError(result.error ?? 'Failed to load results');
                setSelectedStageResults([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setSelectedStageResults([]);
        } finally {
            setLoadingResults(false);
        }
    }, []);

    const fetchAllSessionResults = useCallback(async (sessionId: number) => {
        setLoadingResults(true);
        try {
            const result = await window.electron.statsDb.getSessionResults(sessionId);
            if (result.success && result.data) {
                setAllSessionResults(result.data);
            }
        } catch {
            setAllSessionResults(null);
        } finally {
            setLoadingResults(false);
        }
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedStage(null);
        setSelectedStageResults([]);
        setAllSessionResults(null);
    }, []);

    return {
        stages,
        selectedStageResults,
        selectedStage,
        allSessionResults,
        loading,
        loadingResults,
        error,
        fetchSessions,
        selectStage,
        fetchAllSessionResults,
        clearSelection,
    };
}