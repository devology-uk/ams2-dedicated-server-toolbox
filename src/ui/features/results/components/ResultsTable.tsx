// src/ui/features/results/components/ResultsTable.tsx

import { type ReactNode, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { AddResultDialog } from './AddResultDialog.js';

import type { StageResultRow } from '../../../../shared/types';
import { useGameLookup } from '../../../hooks/useGameLookup';
import { useDriverAliases } from '../../../hooks/useDriverAliases';
import { formatStageName, formatLapTime, formatTotalTime } from '../../../utils/formatters';

interface StageContext {
    sessionId: number;
    sessionIndex: number;
    stageName: string;
    trackId: number;
    startTime: number;
}

interface ResultsTableProps {
    results: StageResultRow[];
    stageContext: StageContext;
    loading: boolean;
    onBack: () => void;
    onPlayerClick: (steamId: string, name: string) => void;
    onRefresh: () => void;
}

const STAGE_COLORS: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
    practice1: 'info',
    qualifying1: 'warning',
    race1: 'success',
};


export function ResultsTable({
                                 results,
                                 stageContext,
                                 loading,
                                 onBack,
                                 onPlayerClick,
                                 onRefresh,
                             }: ResultsTableProps) {
    const { resolveTrack } = useGameLookup();
    const { resolveAlias, aliasVersion } = useDriverAliases();
    const [addResultVisible, setAddResultVisible] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Pre-resolve display names into new row objects so PrimeReact DataTable
    // sees changed data (and re-runs body templates) when aliases change.
    type ResolvedRow = StageResultRow & { displayName: string; steamName: string };
    const resolvedResults = useMemo<ResolvedRow[]>(
        () => results.map((r) => ({
            ...r,
            displayName: resolveAlias(r.steamId, r.name || '(Unknown)'),
            steamName: r.name,
        })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [results, aliasVersion],
    );

    // Find fastest lap across all results for highlighting
    const fastestLapTime = results.reduce<number | null>((best, r) => {
        if (r.fastestLapTime && r.fastestLapTime > 0) {
            return best === null ? r.fastestLapTime : Math.min(best, r.fastestLapTime);
        }
        return best;
    }, null);

    const stageSeverity = STAGE_COLORS[stageContext.stageName] ?? 'secondary';
    const sessionDate = new Date(stageContext.startTime * 1000);

    const title = (
        <div className="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
            <div className="flex align-items-center gap-3">
                <Button
                    icon="pi pi-arrow-left"
                    rounded
                    text
                    onClick={onBack}
                    tooltip="Back to list"
                />
                <div className="flex flex-column">
                    <div className="flex align-items-center gap-2">
            <span className="text-xl font-semibold">
              Session #{stageContext.sessionIndex}
            </span>
                        <Tag
                            value={formatStageName(stageContext.stageName)}
                            severity={stageSeverity}
                        />
                    </div>
                    <span className="text-color-secondary text-sm">
            {sessionDate.toLocaleDateString()} {sessionDate.toLocaleTimeString()} ·
            {resolveTrack(stageContext.trackId)}
          </span>
                </div>
            </div>
            <div className="flex align-items-center gap-2">
                <Tag
                    value={`${results.length} drivers`}
                    icon="pi pi-users"
                    severity="info"
                />
                {fastestLapTime && (
                    <Tag
                        value={`Fastest: ${formatLapTime(fastestLapTime)}`}
                        icon="pi pi-bolt"
                        severity="success"
                    />
                )}
                <Button
                    label="Add Result"
                    icon="pi pi-plus"
                    size="small"
                    severity="secondary"
                    onClick={() => setAddResultVisible(true)}
                />
            </div>
        </div>
    );

    if (loading) {
        return (
            <Card className="shadow-2">
                <div className="flex align-items-center justify-content-center p-6">
                    <ProgressSpinner />
                </div>
            </Card>
        );
    }

    const positionBodyTemplate = (row: StageResultRow): ReactNode => {
        if (row.position <= 3) {
            const icons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
            return (
                <span className="text-lg" title={`P${row.position}`}>
          {icons[row.position]}
        </span>
            );
        }
        return <span className="font-semibold text-color-secondary">P{row.position}</span>;
    };

    const nameBodyTemplate = (row: ResolvedRow): ReactNode => {
        const hasAlias = row.displayName !== row.steamName;
        return (
            <Button
                label={row.displayName}
                title={hasAlias ? row.steamName : undefined}
                link
                className="p-0 font-semibold"
                onClick={(e) => {
                    e.stopPropagation();
                    if (row.steamId) {
                        onPlayerClick(row.steamId, row.steamName);
                    }
                }}
                disabled={!row.steamId}
            />
        );
    };

    const fastestLapBodyTemplate = (row: StageResultRow): ReactNode => {
        const isOverallFastest =
            row.fastestLapTime != null &&
            row.fastestLapTime > 0 &&
            row.fastestLapTime === fastestLapTime;

        return (
            <span
                className={`font-mono ${isOverallFastest ? 'text-green-600 font-bold' : ''}`}
            >
        {isOverallFastest && <i className="pi pi-bolt mr-1 text-green-600" />}
                {formatLapTime(row.fastestLapTime)}
      </span>
        );
    };

    const totalTimeBodyTemplate = (row: StageResultRow): ReactNode => (
        <span className="font-mono">{formatTotalTime(row.totalTime)}</span>
    );

    const stateBodyTemplate = (row: StageResultRow): ReactNode => {
        const severityMap: Record<string, 'success' | 'danger' | 'warning' | 'secondary'> = {
            Finished: 'success',
            DNF: 'danger',
            Retired: 'warning',
            Disqualified: 'danger',
        };
        const severity = severityMap[row.state] ?? 'secondary';
        return <Tag value={row.state} severity={severity} />;
    };

    const lapsBodyTemplate = (row: StageResultRow): ReactNode => (
        <span className="text-center">{row.lapsCompleted}</span>
    );

    const handleDeleteManual = (id: number) => {
        confirmDialog({
            message: 'Remove this manually-added result?',
            header: 'Confirm deletion',
            icon: 'pi pi-trash',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                setDeletingId(id);
                const res = await window.electron.statsDb.deleteManualResult(id);
                setDeletingId(null);
                if (res.success) {
                    onRefresh();
                }
            },
        });
    };

    const actionsBodyTemplate = (row: ResolvedRow): ReactNode => {
        if (!row.isManual) return null;
        return (
            <div className="flex align-items-center gap-1">
                <Tag value="Manual" severity="warning" />
                <Button
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    text
                    loading={deletingId === row.id}
                    tooltip="Remove manual result"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => handleDeleteManual(row.id)}
                />
            </div>
        );
    };

    return (
        <Card title={title} className="shadow-2">
            <ConfirmDialog />
            <AddResultDialog
                visible={addResultVisible}
                onHide={() => setAddResultVisible(false)}
                sessionId={stageContext.sessionId}
                stageName={stageContext.stageName}
                existingResults={resolvedResults}
                onResultAdded={() => { setAddResultVisible(false); onRefresh(); }}
            />
            <DataTable
                value={resolvedResults}
                stripedRows
                emptyMessage="No results available."
                rowHover
            >
                <Column
                    field="position"
                    header="Pos"
                    body={positionBodyTemplate}
                    style={{ width: '5rem' }}
                    className="text-center"
                />
                <Column
                    field="name"
                    header="Driver"
                    body={nameBodyTemplate}
                    sortable
                />
                <Column
                    field="fastestLapTime"
                    header="Fastest Lap"
                    body={fastestLapBodyTemplate}
                    sortable
                    style={{ width: '10rem' }}
                />
                <Column
                    field="lapsCompleted"
                    header="Laps"
                    body={lapsBodyTemplate}
                    sortable
                    style={{ width: '5rem' }}
                    className="text-center"
                />
                <Column
                    field="totalTime"
                    header="Total Time"
                    body={totalTimeBodyTemplate}
                    sortable
                    style={{ width: '10rem' }}
                />
                <Column
                    field="state"
                    header="Status"
                    body={stateBodyTemplate}
                    sortable
                    style={{ width: '8rem' }}
                />
                <Column
                    header=""
                    body={actionsBodyTemplate}
                    style={{ width: '9rem' }}
                />
            </DataTable>
        </Card>
    );
}