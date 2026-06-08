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
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import type { StageListItem } from '../hooks/useResults';
import { useGameLookup } from '../../../hooks/useGameLookup';
import { formatStageName, formatEpochDate, formatEpochTime, formatDurationRange } from '../../../utils/formatters';

interface StageListProps {
    stages: StageListItem[];
    loading: boolean;
    onSelectStage: (stage: StageListItem) => void;
    onDeleteSession: (sessionId: number) => void;
}

type StageFilter = 'all' | 'practice1' | 'qualifying1' | 'race1';

function stageSeverity(name: string): 'info' | 'warning' | 'success' | 'secondary' {
    const lower = name.toLowerCase();
    if (lower.includes('practice')) return 'info';
    if (lower.includes('qualify')) return 'warning';
    if (lower.includes('race')) return 'success';
    return 'secondary';
}


export function StageList({ stages, loading, onSelectStage, onDeleteSession }: StageListProps) {
    const { resolveTrack, resolveVehicle } = useGameLookup();
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
            <span className="font-semibold">{formatEpochDate(row.startTime)}</span>
            <span className="text-color-secondary text-xs">{formatEpochTime(row.startTime)}</span>
        </div>
    );

    const sessionBodyTemplate = (row: StageListItem): ReactNode => (
        <span className="font-mono font-semibold">#{row.sessionIndex}</span>
    );

    const stageBodyTemplate = (row: StageListItem): ReactNode => (
        <Tag value={formatStageName(row.stageName)} severity={stageSeverity(row.stageName)} />
    );

    const trackBodyTemplate = (row: StageListItem): ReactNode => (
        <span className="text-sm">{resolveTrack(row.trackId)}</span>
    );

    const vehicleBodyTemplate = (row: StageListItem): ReactNode => (
        <span className="text-sm">{resolveVehicle(row.vehicleModelId)}</span>
    );

    const participantsBodyTemplate = (row: StageListItem): ReactNode => (
        <div className="flex align-items-center gap-1">
            <i className="pi pi-users text-color-secondary" />
            <span>{row.participantCount}</span>
        </div>
    );

    const durationBodyTemplate = (row: StageListItem): ReactNode => (
        <span className="text-color-secondary">
      {formatDurationRange(row.startTime, row.endTime)}
    </span>
    );

    const handleDeleteClick = (e: React.MouseEvent, row: StageListItem) => {
        e.stopPropagation();
        confirmDialog({
            target: e.currentTarget as HTMLElement,
            message: 'Delete this session and all its results? This cannot be undone.',
            header: 'Delete Session',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: () => onDeleteSession(row.sessionId),
        });
    };

    const actionsBodyTemplate = (row: StageListItem): ReactNode => (
        <div className="flex gap-1 justify-content-center">
            <Button
                icon="pi pi-chart-bar"
                rounded
                text
                severity="info"
                onClick={(e) => { e.stopPropagation(); onSelectStage(row); }}
                tooltip="View Results"
                tooltipOptions={{ position: 'left' }}
            />
            <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                onClick={(e) => handleDeleteClick(e, row)}
                tooltip="Delete Session"
                tooltipOptions={{ position: 'left' }}
            />
        </div>
    );

    return (
        <Card className="shadow-2">
            <ConfirmDialog />
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
                    style={{ width: '7rem' }}
                    className="text-center"
                />
            </DataTable>
        </Card>
    );
}