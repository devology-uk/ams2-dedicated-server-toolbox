// src/ui/features/results/components/StageList.tsx

import { useMemo, useState, type ReactNode } from 'react';
import { DataTable, type DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import type { StageListItem } from '../hooks/useResults';

interface StageListProps {
    stages: StageListItem[];
    loading: boolean;
    onSelectStage: (stage: StageListItem) => void;
}

type StageFilter = 'all' | 'practice1' | 'qualifying1' | 'race1';

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

function formatDate(epoch: number): string {
    const date = new Date(epoch * 1000);
    return date.toLocaleDateString();
}

function formatTime(epoch: number): string {
    const date = new Date(epoch * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startTime: number, endTime: number | null): string {
    if (!endTime) return '-';
    const seconds = endTime - startTime;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) return `${hours}h ${remainingMinutes}m`;
    return `${minutes}m`;
}

export function StageList({ stages, loading, onSelectStage }: StageListProps) {
    const [stageFilter, setStageFilter] = useState<StageFilter>('all');
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters] = useState<DataTableFilterMeta>({
                                                        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                                                    });

    const filteredStages = useMemo(() => {
        if (stageFilter === 'all') return stages;
        return stages.filter((s) => s.stageName === stageFilter);
    }, [stages, stageFilter]);

    // Get unique stage types for the filter dropdown
    const stageTypeOptions = useMemo(() => {
        const types = new Set(stages.map((s) => s.stageName));
        return [
            { label: 'All Stages', value: 'all' },
            ...Array.from(types)
                    .sort()
                    .map((t) => ({ label: formatStageName(t), value: t })),
        ];
    }, [stages]);

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
            <div className="flex align-items-center gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search..."
          />
        </span>
            </div>
            <div className="flex align-items-center gap-2">
                <label className="font-semibold text-sm">Stage:</label>
                <Dropdown
                    value={stageFilter}
                    options={stageTypeOptions}
                    onChange={(e) => setStageFilter(e.value)}
                    className="w-12rem"
                />
            </div>
        </div>
    );

    const dateBodyTemplate = (row: StageListItem): ReactNode => (
        <div className="flex flex-column">
            <span className="font-semibold">{formatDate(row.startTime)}</span>
            <span className="text-color-secondary text-xs">{formatTime(row.startTime)}</span>
        </div>
    );

    const sessionBodyTemplate = (row: StageListItem): ReactNode => (
        <span className="font-mono font-semibold">#{row.sessionIndex}</span>
    );

    const stageBodyTemplate = (row: StageListItem): ReactNode => {
        const severity = STAGE_COLORS[row.stageName] ?? 'secondary';
        return <Tag value={formatStageName(row.stageName)} severity={severity} />;
    };

    const trackBodyTemplate = (row: StageListItem): ReactNode => (
        <code className="text-sm surface-100 px-2 py-1 border-round">{row.trackId}</code>
    );

    const vehicleBodyTemplate = (row: StageListItem): ReactNode => (
        <code className="text-sm surface-100 px-2 py-1 border-round">{row.vehicleModelId}</code>
    );

    const participantsBodyTemplate = (row: StageListItem): ReactNode => (
        <div className="flex align-items-center gap-1">
            <i className="pi pi-users text-color-secondary" />
            <span>{row.participantCount}</span>
        </div>
    );

    const durationBodyTemplate = (row: StageListItem): ReactNode => (
        <span className="text-color-secondary">
      {formatDuration(row.startTime, row.endTime)}
    </span>
    );

    const actionsBodyTemplate = (row: StageListItem): ReactNode => (
        <Button
            icon="pi pi-chart-bar"
            rounded
            text
            severity="info"
            onClick={() => onSelectStage(row)}
            tooltip="View Results"
            tooltipOptions={{ position: 'left' }}
        />
    );

    return (
        <Card className="shadow-2">
            <DataTable
                value={filteredStages}
                header={header}
                globalFilter={globalFilter}
                filters={filters}
                loading={loading}
                paginator
                rows={15}
                rowsPerPageOptions={[15, 30, 50]}
                stripedRows
                emptyMessage="No sessions with results found."
                sortField="startTime"
                sortOrder={-1}
                rowHover
                onRowClick={(e) => onSelectStage(e.data as StageListItem)}
                selectionMode="single"
                className="cursor-pointer"
            >
                <Column
                    field="startTime"
                    header="Date"
                    body={dateBodyTemplate}
                    sortable
                    style={{ width: '10rem' }}
                />
                <Column
                    field="sessionIndex"
                    header="Session"
                    body={sessionBodyTemplate}
                    sortable
                    style={{ width: '7rem' }}
                />
                <Column
                    field="stageName"
                    header="Stage"
                    body={stageBodyTemplate}
                    sortable
                    style={{ width: '9rem' }}
                />
                <Column
                    field="trackId"
                    header="Track"
                    body={trackBodyTemplate}
                    sortable
                    style={{ width: '10rem' }}
                />
                <Column
                    field="vehicleModelId"
                    header="Vehicle"
                    body={vehicleBodyTemplate}
                    sortable
                    style={{ width: '10rem' }}
                />
                <Column
                    header="Drivers"
                    body={participantsBodyTemplate}
                    style={{ width: '6rem' }}
                    className="text-center"
                />
                <Column
                    header="Duration"
                    body={durationBodyTemplate}
                    style={{ width: '7rem' }}
                />
                <Column
                    body={actionsBodyTemplate}
                    style={{ width: '4rem' }}
                    className="text-center"
                />
            </DataTable>
        </Card>
    );
}