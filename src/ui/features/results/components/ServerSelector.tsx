// src/ui/features/results/components/ServerSelector.tsx

import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

import type { ServerSummary } from '../../../../shared/types';

interface ServerSelectorProps {
    servers: ServerSummary[];
    selectedServer: ServerSummary | null;
    onSelect: (server: ServerSummary) => void;
    onDelete: (serverId: number) => void;
    onImport: () => void;
    importing: boolean;
}

export function ServerSelector({
                                   servers,
                                   selectedServer,
                                   onSelect,
                                   onDelete,
                                   onImport,
                                   importing,
                               }: ServerSelectorProps) {
    const serverTemplate = (option: ServerSummary) => (
        <div className="flex align-items-center gap-2">
            <i className="pi pi-server text-primary" />
            <div className="flex flex-column">
                <span className="font-semibold">{option.name}</span>
                <span className="text-color-secondary text-xs">
          {option.sessionCount} sessions · {option.playerCount} players
        </span>
            </div>
        </div>
    );

    const selectedTemplate = (option: ServerSummary | null) => {
        if (!option) {
            return <span className="text-color-secondary">Select a server...</span>;
        }
        return (
            <div className="flex align-items-center gap-2">
                <i className="pi pi-server text-primary" />
                <span className="font-semibold">{option.name}</span>
                <Tag
                    value={`${option.sessionCount} sessions`}
                    severity="info"
                    className="text-xs"
                />
            </div>
        );
    };

    const confirmDelete = () => {
        if (!selectedServer) return;

        confirmDialog({
                          message: `Delete all imported data for "${selectedServer.name}"? This cannot be undone.`,
                          header: 'Confirm Delete',
                          icon: 'pi pi-exclamation-triangle',
                          acceptClassName: 'p-button-danger',
                          accept: () => onDelete(selectedServer.id),
                      });
    };

    return (
        <>
            <ConfirmDialog />
            <div className="flex align-items-center gap-2 flex-wrap">
                <Dropdown
                    value={selectedServer}
                    options={servers}
                    onChange={(e) => onSelect(e.value)}
                    optionLabel="name"
                    placeholder="Select a server..."
                    itemTemplate={serverTemplate}
                    valueTemplate={selectedTemplate}
                    className="w-20rem"
                    dataKey="id"
                />
                <Button
                    label="Import Stats File"
                    icon="pi pi-upload"
                    onClick={onImport}
                    loading={importing}
                    severity="success"
                />
                {selectedServer && (
                    <Button
                        icon="pi pi-trash"
                        onClick={confirmDelete}
                        severity="danger"
                        outlined
                        tooltip="Delete server data"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                )}
            </div>
        </>
    );
}