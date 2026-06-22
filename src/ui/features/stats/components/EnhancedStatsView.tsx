// src/ui/features/stats/components/EnhancedStatsView.tsx

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Panel } from 'primereact/panel';
import type { AMS2EnhancedStatsParser } from '../../../../shared/utils/ams2EnhancedStatsParser';
import type { EnhancedSession } from '../../../../shared/types/ams2EnhancedStats';
import { AMS2EnhancedStatsParser as Parser } from '../../../../shared/utils/ams2EnhancedStatsParser.ts';
import { formatStageName } from '../../../utils/formatters.ts';

interface EnhancedStatsViewProps {
    parser: AMS2EnhancedStatsParser;
}

function stateTag(state: string | null) {
    if (!state) return null;
    const severity = state === 'Finished' ? 'success' : state === 'DNF' ? 'danger' : 'secondary';
    return <Tag value={state} severity={severity} />;
}

function msCol(ms: number | null | undefined) {
    return <span className="font-mono text-sm">{Parser.formatMs(ms)}</span>;
}

function SessionResultsPanel({ session }: { session: EnhancedSession }) {
    const results = session.results.map((r) => ({ ...r, displayName: r.name ?? `#${r.refid}` }));

    return (
        <div className="p-3 flex flex-column gap-3">
            <DataTable
                value={results}
                size="small"
                emptyMessage="No results recorded"
                rowClassName={(r) => (!r.position ? 'surface-100' : '')}
            >
                <Column field="position" header="Pos" style={{ width: '60px' }}
                    body={(r) => r.position ?? '—'} />
                <Column field="displayName" header="Driver" />
                <Column header="State" body={(r) => stateTag(r.state)} style={{ width: '90px' }} />
                <Column header="Best Lap" body={(r) => msCol(r.best_lap_time)} style={{ width: '110px' }} />
                <Column header="S1" body={(r) => msCol(r.best_s1)} style={{ width: '90px' }} />
                <Column header="S2" body={(r) => msCol(r.best_s2)} style={{ width: '90px' }} />
                <Column header="S3" body={(r) => msCol(r.best_s3)} style={{ width: '90px' }} />
                <Column header="Total Time" body={(r) => msCol(r.total_time)} style={{ width: '110px' }} />
                <Column field="laps_complete" header="Laps" style={{ width: '60px' }}
                    body={(r) => r.laps_complete ?? '—'} />
                <Column field="car" header="Car" body={(r) => r.car ?? '—'} />
            </DataTable>
        </div>
    );
}

export function EnhancedStatsView({ parser }: EnhancedStatsViewProps) {
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const sessions = parser.getSessions();

    const stageSeverity = (stage: string | null): 'success' | 'info' | 'secondary' => {
        if (!stage) return 'secondary';
        const s = stage.toLowerCase();
        if (s.startsWith('race')) return 'success';
        if (s.startsWith('quali')) return 'info';
        return 'secondary';
    };

    return (
        <div className="flex flex-column gap-3">
            {/* Summary bar */}
            <div className="flex gap-4 p-3 surface-100 border-round">
                <div className="flex flex-column align-items-center">
                    <span className="text-2xl font-bold">{sessions.length}</span>
                    <span className="text-xs text-color-secondary">Sessions</span>
                </div>
                <div className="flex flex-column align-items-center">
                    <span className="text-2xl font-bold">{parser.getUniqueDriverCount()}</span>
                    <span className="text-xs text-color-secondary">Unique Drivers</span>
                </div>
                <div className="flex flex-column align-items-center">
                    <span className="text-2xl font-bold">v{parser.getPluginVersion()}</span>
                    <span className="text-xs text-color-secondary">Plugin Version</span>
                </div>
            </div>

            {/* Session list */}
            {sessions.length === 0 ? (
                <p className="text-color-secondary text-center p-4">
                    No completed sessions in this file yet.
                </p>
            ) : (
                [...sessions].reverse().map((session) => {
                    const isExpanded = expandedSession === session.uid;
                    const trackName = parser.getTrackName(session);
                    const resultCount = session.results.length;
                    const driverCount = session.drivers.filter((d) => d.started).length;

                    return (
                        <Panel
                            key={session.uid}
                            collapsed={!isExpanded}
                            onToggle={() => setExpandedSession(isExpanded ? null : session.uid)}
                            toggleable
                            header={
                                <div className="flex align-items-center gap-3 w-full">
                                    <Tag
                                        value={formatStageName(session.stage ?? 'Practice1')}
                                        severity={stageSeverity(session.stage ?? 'practice')}
                                    />
                                    <span className="font-semibold">{trackName}</span>
                                    <span className="text-color-secondary text-sm ml-auto">
                                        {session.started_at.replace('T', ' ')}
                                    </span>
                                    <span className="text-sm text-color-secondary">
                                        {driverCount} drivers · {resultCount} results
                                    </span>
                                </div>
                            }
                        >
                            <SessionResultsPanel session={session} />
                        </Panel>
                    );
                })
            )}
        </div>
    );
}
