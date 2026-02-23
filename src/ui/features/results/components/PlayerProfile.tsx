// src/ui/features/results/components/PlayerProfile.tsx

import { type ReactNode, useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import type { PlayerResultHistory, PlayerBestLap } from '../../../../shared/types';
import { useGameLookup } from '../../../hooks/useGameLookup';
import { useDriverAliases } from '../../../hooks/useDriverAliases';
import { formatStageName, formatLapTime } from '../../../utils/formatters';

interface PlayerProfileProps {
    visible: boolean;
    onHide: () => void;
    steamId: string | null;
    name: string | null;
    history: PlayerResultHistory[];
    bestLaps: PlayerBestLap[];
    loading: boolean;
    error: string | null;
}

const STAGE_COLORS: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
    practice1: 'info',
    qualifying1: 'warning',
    race1: 'success',
};

export function PlayerProfile({
                                  visible,
                                  onHide,
                                  steamId,
                                  name,
                                  history,
                                  bestLaps,
                                  loading,
                                  error,
                              }: PlayerProfileProps) {
    const { resolveTrack } = useGameLookup();
    const { getAlias, setAlias, deleteAlias } = useDriverAliases();

    const currentAlias = steamId ? getAlias(steamId) : undefined;
    const [aliasInput, setAliasInput] = useState(currentAlias ?? '');
    const [saving, setSaving] = useState(false);

    // Sync input when the dialog opens for a new player
    useEffect(() => {
        setAliasInput(currentAlias ?? '');
    }, [steamId, currentAlias]);

    const handleSaveAlias = async () => {
        if (!steamId || !aliasInput.trim()) return;
        setSaving(true);
        await setAlias(steamId, aliasInput.trim());
        setSaving(false);
    };

    const handleClearAlias = async () => {
        if (!steamId) return;
        setSaving(true);
        await deleteAlias(steamId);
        setAliasInput('');
        setSaving(false);
    };

    const displayName = currentAlias ?? name ?? 'Unknown Player';

    const headerElement = (
        <div className="flex align-items-center gap-3">
            <i className="pi pi-user text-2xl text-primary" />
            <div className="flex flex-column">
                <span className="text-xl font-semibold">{displayName}</span>
                {steamId && (
                    <code className="text-xs text-color-secondary">{steamId}</code>
                )}
            </div>
        </div>
    );

    // Calculate summary stats
    const totalRaces = history.length;
    const wins = history.filter((h) => h.position === 1).length;
    const podiums = history.filter((h) => h.position <= 3).length;
    const bestPosition = history.length > 0 ? Math.min(...history.map((h) => h.position)) : null;

    const dateBodyTemplate = (row: PlayerResultHistory): ReactNode => {
        const date = new Date(row.sessionStartTime * 1000);
        return (
            <span className="text-sm">
        {date.toLocaleDateString()}
      </span>
        );
    };

    const stageBodyTemplate = (row: PlayerResultHistory): ReactNode => {
        const severity = STAGE_COLORS[row.stageName] ?? 'secondary';
        return <Tag value={formatStageName(row.stageName)} severity={severity} />;
    };

    const positionBodyTemplate = (row: PlayerResultHistory): ReactNode => {
        if (row.position <= 3) {
            const icons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
            return <span>{icons[row.position]}</span>;
        }
        return <span>P{row.position}</span>;
    };

    const fastestLapBodyTemplate = (row: PlayerResultHistory): ReactNode => (
        <span className="font-mono text-sm">{formatLapTime(row.fastestLapTime)}</span>
    );

    const stateBodyTemplate = (row: PlayerResultHistory): ReactNode => {
        const severityMap: Record<string, 'success' | 'danger' | 'warning' | 'secondary'> = {
            Finished: 'success',
            DNF: 'danger',
            Retired: 'warning',
        };
        return <Tag value={row.state} severity={severityMap[row.state] ?? 'secondary'} />;
    };

    const bestLapDateTemplate = (row: PlayerBestLap): ReactNode => {
        const date = new Date(row.sessionStartTime * 1000);
        return <span className="text-sm">{date.toLocaleDateString()}</span>;
    };

    const bestLapTimeTemplate = (row: PlayerBestLap): ReactNode => (
        <span className="font-mono font-bold text-green-600">
      <i className="pi pi-bolt mr-1" />
            {formatLapTime(row.bestLapTime)}
    </span>
    );

    return (
        <Dialog
            header={headerElement}
            visible={visible}
            onHide={onHide}
            style={{ width: '55rem' }}
            breakpoints={{ '960px': '80vw', '641px': '95vw' }}
            maximizable
        >
            {loading ? (
                <div className="flex align-items-center justify-content-center p-6">
                    <ProgressSpinner />
                </div>
            ) : error ? (
                <div className="flex align-items-center justify-content-center p-4">
                    <Tag value={error} severity="danger" icon="pi pi-times" />
                </div>
            ) : (
                <div className="flex flex-column gap-3">
                    {/* Alias editor */}
                    {steamId && (
                        <div className="flex flex-column gap-1">
                        <label className="text-sm text-color-secondary">
                            Display name — overrides the Steam username shown in Results and Stats
                        </label>
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-tag text-color-secondary" />
                            <InputText
                                value={aliasInput}
                                onChange={(e) => setAliasInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAlias(); }}
                                placeholder={name ?? 'Set display name…'}
                                className="flex-1"
                                size="small"
                            />
                            <Button
                                label="Save"
                                icon="pi pi-check"
                                size="small"
                                onClick={handleSaveAlias}
                                loading={saving}
                                disabled={!aliasInput.trim() || aliasInput.trim() === currentAlias}
                            />
                            {currentAlias && (
                                <Button
                                    icon="pi pi-times"
                                    size="small"
                                    severity="secondary"
                                    tooltip="Remove alias"
                                    tooltipOptions={{ position: 'top' }}
                                    onClick={handleClearAlias}
                                    loading={saving}
                                />
                            )}
                        </div>
                        </div>
                    )}

                    {/* Summary cards */}
                    <div className="grid">
                        <div className="col-6 md:col-3">
                            <SummaryCard label="Entries" value={totalRaces.toString()} icon="pi-flag" />
                        </div>
                        <div className="col-6 md:col-3">
                            <SummaryCard label="Wins" value={wins.toString()} icon="pi-trophy" />
                        </div>
                        <div className="col-6 md:col-3">
                            <SummaryCard label="Podiums" value={podiums.toString()} icon="pi-star" />
                        </div>
                        <div className="col-6 md:col-3">
                            <SummaryCard
                                label="Best Pos."
                                value={bestPosition ? `P${bestPosition}` : '-'}
                                icon="pi-arrow-up"
                            />
                        </div>
                    </div>

                    {/* Best laps per track */}
                    {bestLaps.length > 0 && (
                        <>
                            <Divider />
                            <h4 className="m-0 flex align-items-center gap-2">
                                <i className="pi pi-bolt text-green-600" />
                                Personal Best Laps
                            </h4>
                            <DataTable value={bestLaps} size="small" stripedRows>
                                <Column
                                    field="trackId"
                                    header="Track"
                                    body={(row: PlayerBestLap) => resolveTrack(row.trackId)}
                                />
                                <Column
                                    field="bestLapTime"
                                    header="Lap Time"
                                    body={bestLapTimeTemplate}
                                />
                                <Column
                                    field="stageName"
                                    header="Stage"
                                    body={(row: PlayerBestLap) => (
                                        <Tag
                                            value={formatStageName(row.stageName)}
                                            severity={STAGE_COLORS[row.stageName] ?? 'secondary'}
                                        />
                                    )}
                                />
                                <Column
                                    field="sessionStartTime"
                                    header="Date"
                                    body={bestLapDateTemplate}
                                />
                            </DataTable>
                        </>
                    )}

                    <Divider />

                    {/* Full result history */}
                    <h4 className="m-0 flex align-items-center gap-2">
                        <i className="pi pi-history" />
                        Result History
                    </h4>
                    <DataTable
                        value={history}
                        size="small"
                        stripedRows
                        paginator
                        rows={10}
                        rowsPerPageOptions={[10, 25]}
                        emptyMessage="No results recorded."
                        sortField="sessionStartTime"
                        sortOrder={-1}
                    >
                        <Column field="sessionStartTime" header="Date" body={dateBodyTemplate} sortable />
                        <Column field="sessionIndex" header="Session" body={(r: PlayerResultHistory) => `#${r.sessionIndex}`} sortable />
                        <Column field="stageName" header="Stage" body={stageBodyTemplate} sortable />
                        <Column field="trackId" header="Track" body={(r: PlayerResultHistory) => resolveTrack(r.trackId)} />
                        <Column field="position" header="Pos" body={positionBodyTemplate} sortable style={{ width: '5rem' }} />
                        <Column field="fastestLapTime" header="Fastest Lap" body={fastestLapBodyTemplate} sortable />
                        <Column field="lapsCompleted" header="Laps" sortable style={{ width: '5rem' }} />
                        <Column field="state" header="Status" body={stateBodyTemplate} />
                    </DataTable>
                </div>
            )}
        </Dialog>
    );
}

interface SummaryCardProps {
    label: string;
    value: string;
    icon: string;
}

function SummaryCard({ label, value, icon }: SummaryCardProps) {
    return (
        <Card className="shadow-1 text-center">
            <i className={`pi ${icon} text-2xl text-primary mb-2`} />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-color-secondary text-sm">{label}</div>
        </Card>
    );
}