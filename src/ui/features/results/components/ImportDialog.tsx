// src/ui/features/results/components/ImportDialog.tsx

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';

import type { ImportResult } from '../../../../shared/types';

interface ImportDialogProps {
    visible: boolean;
    onHide: () => void;
    importing: boolean;
    result: ImportResult | null;
    error: string | null;
}

export function ImportDialog({
                                 visible,
                                 onHide,
                                 importing,
                                 result,
                                 error,
                             }: ImportDialogProps) {
    const footer = (
        <Button
            label="Close"
            icon="pi pi-check"
            onClick={onHide}
            disabled={importing}
        />
    );

    return (
        <Dialog
            header="Import Stats"
            visible={visible}
            onHide={onHide}
            footer={footer}
            closable={!importing}
            style={{ width: '30rem' }}
        >
            {importing && (
                <div className="flex flex-column align-items-center gap-3 p-4">
                    <i className="pi pi-spin pi-spinner text-4xl text-primary" />
                    <span className="text-lg">Importing stats data...</span>
                    <ProgressBar mode="indeterminate" style={{ width: '100%', height: '6px' }} />
                </div>
            )}

            {error && !importing && (
                <div className="flex flex-column align-items-center gap-3 p-4">
                    <i className="pi pi-times-circle text-4xl text-red-500" />
                    <span className="text-lg font-semibold text-red-500">Import Failed</span>
                    <span className="text-color-secondary text-center">{error}</span>
                </div>
            )}

            {result && !importing && (
                <div className="flex flex-column gap-3 p-2">
                    {/* Server info */}
                    <div className="flex align-items-center gap-2 mb-2">
                        <i className="pi pi-server text-primary text-xl" />
                        <span className="text-lg font-semibold">{result.serverName}</span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid">
                        <div className="col-6">
                            <ImportStat
                                label="Sessions in File"
                                value={result.sessionsInFile}
                                icon="pi-file"
                            />
                        </div>
                        <div className="col-6">
                            <ImportStat
                                label="Imported"
                                value={result.imported}
                                icon="pi-plus-circle"
                                severity="success"
                            />
                        </div>
                        <div className="col-6">
                            <ImportStat
                                label="Updated"
                                value={result.updated}
                                icon="pi-refresh"
                                severity="info"
                            />
                        </div>
                        <div className="col-6">
                            <ImportStat
                                label="Skipped"
                                value={result.skipped}
                                icon="pi-minus-circle"
                                severity="warning"
                            />
                        </div>
                    </div>

                    {/* Errors */}
                    {result.errors.length > 0 && (
                        <div className="flex flex-column gap-2">
              <span className="font-semibold text-red-500">
                <i className="pi pi-exclamation-triangle mr-1" />
                  {result.errors.length} error(s)
              </span>
                            {result.errors.map((err, i) => (
                                <div key={i} className="surface-100 p-2 border-round text-sm">
                                    <span className="font-semibold">Session #{err.sessionIndex}:</span>{' '}
                                    {err.error}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Summary */}
                    <div className="flex justify-content-center mt-2">
                        {result.errors.length === 0 ? (
                            <Tag value="Import Successful" severity="success" icon="pi pi-check" />
                        ) : result.imported > 0 ? (
                            <Tag value="Partial Import" severity="warning" icon="pi pi-exclamation-triangle" />
                        ) : (
                            <Tag value="Import Failed" severity="danger" icon="pi pi-times" />
                        )}
                    </div>
                </div>
            )}
        </Dialog>
    );
}

interface ImportStatProps {
    label: string;
    value: number;
    icon: string;
    severity?: 'success' | 'info' | 'warning' | 'danger';
}

function ImportStat({ label, value, icon, severity }: ImportStatProps) {
    const colorMap = {
        success: 'text-green-600',
        info: 'text-blue-600',
        warning: 'text-orange-600',
        danger: 'text-red-600',
    };

    const valueColor = severity ? colorMap[severity] : 'text-color';

    return (
        <div className="surface-100 border-round p-3 text-center">
            <div className={`text-2xl font-bold ${valueColor}`}>
                <i className={`pi ${icon} mr-1`} />
                {value}
            </div>
            <div className="text-color-secondary text-sm mt-1">{label}</div>
        </div>
    );
}