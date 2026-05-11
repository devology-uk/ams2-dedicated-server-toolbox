import { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';

import './StatsViewer.scss';
import { useStats } from './hooks/useStats.js';
import { OverviewTab } from './components/OverviewTab.js';
import { PlayersTab } from './components/PlayersTab.js';
import { SessionsTab } from './components/SessionsTab.js';
import { EnhancedStatsView } from './components/EnhancedStatsView.js';
import { useImport } from '../../hooks/useImport';
import { ImportDialog } from '../../components/ImportDialog';


export function StatsViewer() {
    const { format, smsParser, enhancedParser, fileName, filePath, loading, error, loadFile, reload } = useStats();
    const { importing, lastImport, error: importError, importFile, importEnhancedFile, clearLastImport } = useImport();
    const [showImportDialog, setShowImportDialog] = useState(false);

    const hasFile = smsParser !== null || enhancedParser !== null;

    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
                <ProgressSpinner />
            </div>
        );
    }

    if (!hasFile) {
        return (
            <div className="flex flex-column align-items-center justify-content-center gap-4 p-6">
                <i className="pi pi-chart-bar text-6xl text-primary"></i>
                <h2 className="m-0">AMS2 Server Stats</h2>
                <p className="text-color-secondary m-0 text-center max-w-25rem">
                    Load a stats file to view server statistics.
                    Supports both <strong>sms_stats</strong> and <strong>ams2_stats</strong> plugin output.
                </p>
                <Button
                    label="Load Stats File"
                    icon="pi pi-folder-open"
                    onClick={loadFile}
                    size="large"
                />
                {error && (
                    <Message severity="error" text={error} className="w-full max-w-30rem" />
                )}
            </div>
        );
    }

    const serverName = smsParser
        ? smsParser.getServerName()
        : enhancedParser?.getServerName() ?? 'Unknown Server';

    const formatBadge = format === 'ams2_stats'
        ? <Tag value="ams2_stats" severity="success" className="text-xs" />
        : <Tag value="sms_stats" severity="info" className="text-xs" />;

    return (
        <div className="stats-viewer h-full flex flex-column">
            {/* Header */}
            <div className="flex align-items-center justify-content-between px-3 pt-3 pb-3 border-bottom-1 surface-border flex-shrink-0">
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-server text-3xl text-primary"></i>
                    <div>
                        <div className="flex align-items-center gap-2">
                            <h1 className="m-0 text-2xl">{serverName}</h1>
                            {formatBadge}
                        </div>
                        <span className="text-color-secondary text-sm">
                            <i className="pi pi-file mr-1"></i>
                            {fileName}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {format === 'sms_stats' && (
                        <Button
                            label="Import to Database"
                            icon="pi pi-database"
                            onClick={async () => {
                                setShowImportDialog(true);
                                await importFile(filePath);
                            }}
                            severity="info"
                            disabled={importing}
                        />
                    )}
                    {format === 'ams2_stats' && (
                        <Button
                            label="Import to Database"
                            icon="pi pi-database"
                            onClick={async () => {
                                setShowImportDialog(true);
                                await importEnhancedFile(filePath);
                            }}
                            severity="success"
                            disabled={importing}
                        />
                    )}
                    <Button label="Reload" icon="pi pi-refresh" onClick={reload} outlined />
                    <Button
                        label="Load Different File"
                        icon="pi pi-folder-open"
                        onClick={loadFile}
                        severity="secondary"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow-1 overflow-hidden p-3">
                {error && (
                    <Message severity="error" text={error} className="w-full mb-4" />
                )}

                {format === 'sms_stats' && smsParser && (
                    <TabView>
                        <TabPanel header="Overview" leftIcon="pi pi-chart-pie mr-2">
                            <OverviewTab parser={smsParser} />
                        </TabPanel>
                        <TabPanel header="Players" leftIcon="pi pi-users mr-2">
                            <PlayersTab parser={smsParser} />
                        </TabPanel>
                        <TabPanel header="Sessions" leftIcon="pi pi-history mr-2">
                            <SessionsTab parser={smsParser} />
                        </TabPanel>
                    </TabView>
                )}

                {format === 'ams2_stats' && enhancedParser && (
                    <div className="h-full overflow-auto">
                        <EnhancedStatsView parser={enhancedParser} />
                    </div>
                )}
            </div>

            <ImportDialog
                visible={showImportDialog}
                onHide={() => {
                    setShowImportDialog(false);
                    clearLastImport();
                }}
                importing={importing}
                result={lastImport}
                error={importError}
            />
        </div>
    );
}
