// src/ui/features/results/components/ResultsTable.tsx

import { type ReactNode } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';

import type { StageResultRow } from '../../../../shared/types';

interface StageContext {
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
}

const STAGE_COLORS: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
    practice1: 'info',
    qualifying1: 'warning',
    race1: 'success',
};

function formatStageName(stage: string): string {
    return stage
        .replace(/([0-9]+)/g, ' \$1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

function formatLapTime(ms: number | null): string {
    if (!ms || ms <= 0) return '--:--.---';

    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const secWhole = Math.floor(seconds);
    const secFraction = Math.round((seconds - secWhole) * 1000);

    const secStr = secWhole.toString().padStart(2, '0');
    const msStr = secFraction.toString().padStart(3, '0');

    if (minutes > 0) {
        return `${minutes}:${secStr}.${msStr}`;
    }
    return `${secStr}.${msStr}`;
}

function formatTotalTime(ms: number): string {
    if (ms <= 0) return '-';

    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ResultsTable({
                                 results,
                                 stageContext,
                                 loading,
                                 onBack,
                                 onPlayerClick,
                             }: ResultsTableProps) {
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
            Track {stageContext.trackId}
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

    const nameBodyTemplate = (row: StageResultRow): ReactNode => (
        <Button
            label={row.name || '(Unknown)'}
            link
            className="p-0 font-semibold"
            onClick={(e) => {
                e.stopPropagation();
                if (row.steamId) {
                    onPlayerClick(row.steamId, row.name);
                }
            }}
            disabled={!row.steamId}
        />
    );

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

    return (
        <Card title={title} className="shadow-2">
            <DataTable
                value={results}
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
            </DataTable>
        </Card>
    );
}