import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';

import './StatsViewer.scss';
import { useStats } from './hooks/useStats.js';
import { OverviewTab } from './components/OverviewTab.js';
import { PlayersTab } from './components/PlayersTab.js';
import { SessionsTab } from './components/SessionsTab.js';


export function StatsViewer() {
  const { parser, fileName, loading, error, loadFile, reload } = useStats();

  if (loading) {
    return (
      <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!parser) {
    return (
      <div className="flex flex-column align-items-center justify-content-center gap-4 p-6">
        <i className="pi pi-chart-bar text-6xl text-primary"></i>
        <h2 className="m-0">AMS2 Server Stats</h2>
        <p className="text-color-secondary m-0">Load a stats file to view server statistics</p>
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

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex align-items-center justify-content-between mb-4">
        <div className="flex align-items-center gap-3">
          <i className="pi pi-server text-3xl text-primary"></i>
          <div>
            <h1 className="m-0 text-2xl">{parser.getServerName()}</h1>
            <span className="text-color-secondary text-sm">
              <i className="pi pi-file mr-1"></i>
              {fileName}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            label="Reload"
            icon="pi pi-refresh"
            onClick={reload}
            outlined
          />
          <Button
            label="Load Different File"
            icon="pi pi-folder-open"
            onClick={loadFile}
            severity="secondary"
          />
        </div>
      </div>

      {error && (
        <Message severity="error" text={error} className="w-full mb-4" />
      )}

      {/* Tabs */}
      <TabView>
        <TabPanel header="Overview" leftIcon="pi pi-chart-pie mr-2">
          <OverviewTab parser={parser} />
        </TabPanel>
        <TabPanel header="Players" leftIcon="pi pi-users mr-2">
          <PlayersTab parser={parser} />
        </TabPanel>
        <TabPanel header="Sessions" leftIcon="pi pi-history mr-2">
          <SessionsTab parser={parser} />
        </TabPanel>
      </TabView>
    </div>
  );
}