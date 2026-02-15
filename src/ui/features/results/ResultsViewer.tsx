// src/ui/features/results/ResultsViewer.tsx

import { useState, useEffect, useCallback } from 'react';
import { Message } from 'primereact/message';

import './ResultsViewer.scss';
import { useServers } from './hooks/useServers.js';
import { useResults } from './hooks/useResults.js';
import { useImport } from './hooks/useImport.js';
import { usePlayerProfile } from './hooks/usePlayerProfile.js';
import { ServerSelector } from './components/ServerSelector.js';
import { StageList } from './components/StageList.js';
import { ResultsTable } from './components/ResultsTable.js';
import { ImportDialog } from './components/ImportDialog.js';
import { PlayerProfile } from './components/PlayerProfile.js';

export function ResultsViewer() {
    const {
        servers,
        selectedServer,
        overview,
        loading: serversLoading,
        error: serversError,
        selectServer,
        refresh: refreshServers,
        deleteServer,
    } = useServers();

    const {
        stages,
        selectedStage,
        selectedStageResults,
        loading: sessionsLoading,
        loadingResults,
        error: resultsError,
        fetchSessions,
        selectStage,
        clearSelection,
    } = useResults();

    const {
        importing,
        lastImport,
        error: importError,
        importFile,
        clearLastImport,
    } = useImport();

    const playerProfile = usePlayerProfile();

    const [importDialogVisible, setImportDialogVisible] = useState(false);

    // Fetch sessions when server changes
    useEffect(() => {
        if (selectedServer) {
            fetchSessions(selectedServer.id, { hasResults: true, limit: 200 });
        }
    }, [selectedServer, fetchSessions]);

    const handleImport = useCallback(async () => {
        setImportDialogVisible(true);
        const result = await importFile();
        if (result) {
            // Refresh data after successful import
            await refreshServers();
            if (selectedServer) {
                await fetchSessions(selectedServer.id, { hasResults: true, limit: 200 });
            }
        }
    }, [importFile, refreshServers, selectedServer, fetchSessions]);

    const handleImportDialogClose = useCallback(() => {
        setImportDialogVisible(false);
        clearLastImport();
    }, [clearLastImport]);

    const handlePlayerClick = useCallback(
        (steamId: string, name: string) => {
            playerProfile.loadProfile(steamId, name, selectedServer?.id);
        },
        [playerProfile, selectedServer],
    );

    const handleDeleteServer = useCallback(
        async (serverId: number) => {
            await deleteServer(serverId);
            clearSelection();
        },
        [deleteServer, clearSelection],
    );

    const error = serversError ?? resultsError;

    // Empty state — no servers imported yet
    if (!serversLoading && servers.length === 0) {
        return (
            <div className="flex flex-column align-items-center justify-content-center gap-4 p-6">
                <i className="pi pi-chart-bar text-6xl text-primary" />
                <h2 className="m-0">Race Results</h2>
                <p className="text-color-secondary m-0 text-center">
                    Import a stats file to start viewing race results and driver performance
                </p>
                <div className="flex gap-2">
                    <button
                        className="p-button p-button-success p-component"
                        onClick={handleImport}
                        disabled={importing}
                    >
                        <span className="p-button-icon p-button-icon-left pi pi-upload" />
                        <span className="p-button-label">Import Stats File</span>
                    </button>
                </div>
                {importError && (
                    <Message severity="error" text={importError} className="w-full max-w-30rem" />
                )}
                <ImportDialog
                    visible={importDialogVisible}
                    onHide={handleImportDialogClose}
                    importing={importing}
                    result={lastImport}
                    error={importError}
                />
            </div>
        );
    }

    return (
        <div className="results-viewer p-3">
            {/* Header */}
            <div className="flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-chart-bar text-3xl text-primary" />
                    <div>
                        <h1 className="m-0 text-2xl">Race Results</h1>
                        {overview && (
                            <span className="text-color-secondary text-sm">
                {overview.totalSessions} sessions · {overview.totalPlayers} players ·{' '}
                                {overview.sessionsWithResults} with results
              </span>
                        )}
                    </div>
                </div>
                <ServerSelector
                    servers={servers}
                    selectedServer={selectedServer}
                    onSelect={selectServer}
                    onDelete={handleDeleteServer}
                    onImport={handleImport}
                    importing={importing}
                />
            </div>

            {error && <Message severity="error" text={error} className="w-full mb-3" />}

            {/* Content — either results table or stage list */}
            {selectedStage ? (
                <ResultsTable
                    results={selectedStageResults}
                    stageContext={{
                        sessionIndex: selectedStage.sessionIndex,
                        stageName: selectedStage.stageName,
                        trackId: selectedStage.trackId,
                        startTime: selectedStage.startTime,
                    }}
                    loading={loadingResults}
                    onBack={clearSelection}
                    onPlayerClick={handlePlayerClick}
                />
            ) : (
                <StageList
                    stages={stages}
                    loading={sessionsLoading}
                    onSelectStage={selectStage}
                />
            )}

            {/* Dialogs */}
            <ImportDialog
                visible={importDialogVisible}
                onHide={handleImportDialogClose}
                importing={importing}
                result={lastImport}
                error={importError}
            />

            <PlayerProfile
                visible={playerProfile.selectedSteamId !== null}
                onHide={playerProfile.clearProfile}
                steamId={playerProfile.selectedSteamId}
                name={playerProfile.selectedName}
                history={playerProfile.history}
                bestLaps={playerProfile.bestLaps}
                loading={playerProfile.loading}
                error={playerProfile.error}
            />
        </div>
    );
}