// src/ui/features/results/hooks/useServers.ts

import { useState, useEffect, useCallback } from 'react';
import type { ServerSummary, ServerOverview } from '../../../../shared/types';

interface UseServersReturn {
    servers: ServerSummary[];
    selectedServer: ServerSummary | null;
    overview: ServerOverview | null;
    loading: boolean;
    error: string | null;
    selectServer: (server: ServerSummary) => void;
    refresh: () => Promise<void>;
    deleteServer: (serverId: number) => Promise<void>;
}

export function useServers(): UseServersReturn {
    const [servers, setServers] = useState<ServerSummary[]>([]);
    const [selectedServer, setSelectedServer] = useState<ServerSummary | null>(null);
    const [overview, setOverview] = useState<ServerOverview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchServers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await window.electron.statsDb.getServers();
            if (result.success && result.data) {
                setServers(result.data);
                // Auto-select first server if none selected
                if (!selectedServer && result.data.length > 0) {
                    setSelectedServer(result.data[0]);
                }
            } else {
                setError(result.error ?? 'Failed to load servers');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [selectedServer]);

    const fetchOverview = useCallback(async (serverId: number) => {
        try {
            const result = await window.electron.statsDb.getServerOverview(serverId);
            if (result.success && result.data) {
                setOverview(result.data);
            }
        } catch {
            // Non-critical — overview is supplementary
            setOverview(null);
        }
    }, []);

    const selectServer = useCallback(
        (server: ServerSummary) => {
            setSelectedServer(server);
            setOverview(null);
            fetchOverview(server.id);
        },
        [fetchOverview],
    );

    const deleteServer = useCallback(
        async (serverId: number) => {
            try {
                const result = await window.electron.statsDb.deleteServer(serverId);
                if (result.success) {
                    if (selectedServer?.id === serverId) {
                        setSelectedServer(null);
                        setOverview(null);
                    }
                    await fetchServers();
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete server');
            }
        },
        [selectedServer, fetchServers],
    );

    // Initial load
    useEffect(() => {
        fetchServers();
    }, [fetchServers]);

    // Fetch overview when server changes
    useEffect(() => {
        if (selectedServer) {
            fetchOverview(selectedServer.id);
        }
    }, [selectedServer, fetchOverview]);

    return {
        servers,
        selectedServer,
        overview,
        loading,
        error,
        selectServer,
        refresh: fetchServers,
        deleteServer,
    };
}