import { useState, useRef, useMemo } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';

import './ConfigBuilder.scss';
import { useConfigState, useFieldSchema } from './hooks';
import { DynamicForm } from './components';
import { ServerSettingsForm } from './components/ServerSettingsForm';
import { HttpApiForm } from './components/HttpApiForm';
import { LuaApiForm } from './components/LuaApiForm';
import { validateConfig } from './utils/config-validation';

export const ConfigBuilderView = () => {
  const toast = useRef<Toast>(null);
  const [activeTab, setActiveTab] = useState(0);

  const { fieldGroups, isLoading, error } = useFieldSchema();

  // Separate flags groups from other session attribute groups
  const { attributeGroups, flagsGroups } = useMemo(() => {
    const attrs = fieldGroups.filter(g => g.id !== 'session-flags');
    const flags = fieldGroups.filter(g => g.id === 'session-flags');
    return { attributeGroups: attrs, flagsGroups: flags };
  }, [fieldGroups]);
  const {
    config,
    isDirty,
    updateSessionAttribute,
    updateRootField,
    importFromString,
    exportToString,
    markAsSaved,
    resetConfig,
  } = useConfigState();

  // Handle import
  const handleImport = async () => {
    if (isDirty) {
      confirmDialog({
        message: 'You have unsaved changes. Import will overwrite them. Continue?',
        header: 'Confirm Import',
        icon: 'pi pi-exclamation-triangle',
        accept: doImport,
      });
    } else {
      doImport();
    }
  };

  const doImport = async () => {
    try {
      const result = await window.electron.importConfig();
      
      if (result.cancelled) {
        return;
      }

      if (!result.success || !result.data) {
        toast.current?.show({
          severity: 'error',
          summary: 'Import Failed',
          detail: result.error ?? 'Could not read file',
          life: 5000,
        });
        return;
      }

      const parseResult = importFromString(result.data);
      
      if (parseResult.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Import Successful',
          detail: `Loaded ${result.filename ?? 'config'}`,
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Parse Error',
          detail: parseResult.error,
          life: 5000,
        });
      }
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Import Failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
        life: 5000,
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    const issues = validateConfig(config);
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warn');

    if (errors.length > 0) {
      toast.current?.show({
        severity: 'error',
        summary: 'Validation Failed',
        detail: errors.map(e => e.message).join('\n'),
        life: 8000,
      });
      return;
    }

    if (warnings.length > 0) {
      const proceed = await new Promise<boolean>(resolve => {
        confirmDialog({
          message: warnings.map(w => w.message).join('\n'),
          header: 'Export Warnings',
          icon: 'pi pi-exclamation-triangle',
          accept: () => resolve(true),
          reject: () => resolve(false),
        });
      });
      if (!proceed) return;
    }

    try {
      const content = exportToString();
      const result = await window.electron.exportConfig(content);

      if (result.cancelled) {
        return;
      }

      if (result.success) {
        markAsSaved();
        toast.current?.show({
          severity: 'success',
          summary: 'Export Successful',
          detail: `Saved to ${result.filename ?? 'server.cfg'}`,
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Export Failed',
          detail: result.error ?? 'Could not save file',
          life: 5000,
        });
      }
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Export Failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
        life: 5000,
      });
    }
  };

  // Handle reset
  const handleReset = () => {
    confirmDialog({
      message: 'Reset all settings to defaults? This cannot be undone.',
      header: 'Confirm Reset',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: resetConfig,
    });
  };

  // Handle session attribute change
  const handleAttributeChange = (name: string, value: unknown) => {
    updateSessionAttribute(name as keyof typeof config.sessionAttributes, value as number);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex align-items-center justify-content-center h-full">
        <div className="text-center">
          <ProgressSpinner />
          <p className="mt-3">Loading configuration schema...</p>
        </div>
      </div>
    );
  }

  // Error state
    if (error) {
        return (
            <div className="flex align-items-center justify-content-center h-full">
                <div className="text-center">
                    <i className="pi pi-exclamation-triangle text-5xl text-yellow-500 mb-3"></i>
                    <h3>Game Data Not Available</h3>
                    <p className="text-color-secondary">{error}</p>
                    <p className="text-color-secondary mt-2">
                        Use the API Explorer to sync data from a running server.
                    </p>
                </div>
            </div>
        );
    }

  // No data state
    if (fieldGroups.length === 0) {
        return (
            <div className="flex align-items-center justify-content-center h-full">
                <div className="text-center">
                    <i className="pi pi-database text-5xl text-color-secondary mb-3"></i>
                    <h3>No Game Data</h3>
                    <p className="text-color-secondary">
                        Sync data from a running server using the API Explorer, or check
                        that the bundled game data file is present.
                    </p>
                </div>
            </div>
        );
    }

  return (
    <div className="config-builder-view h-full flex flex-column">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header / Toolbar */}
      <div className="flex align-items-center justify-content-between p-3 border-bottom-1 surface-border">
        <div className="flex align-items-center gap-2">
          <h2 className="m-0 text-xl">Configuration Builder</h2>
          {isDirty && (
            <span className="text-orange-500 text-sm font-medium">
              (unsaved changes)
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            label="Import"
            icon="pi pi-upload"
            severity="secondary"
            outlined
            onClick={handleImport}
          />
          <Button
            label="Export"
            icon="pi pi-download"
            severity="success"
            onClick={handleExport}
          />
          <Button
            label="Reset"
            icon="pi pi-refresh"
            severity="danger"
            outlined
            onClick={handleReset}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 overflow-auto p-3">
        
<TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
  <TabPanel header="Server Settings" leftIcon="pi pi-server mr-2">
    <ServerSettingsForm
      config={config}
      onChange={updateRootField}
    />
  </TabPanel>

  <TabPanel header="Session Attributes" leftIcon="pi pi-cog mr-2">
    <DynamicForm
      fieldGroups={attributeGroups}
      values={config.sessionAttributes ?? {}}
      onChange={handleAttributeChange}
    />
  </TabPanel>

  <TabPanel header="Session Flags" leftIcon="pi pi-flag mr-2">
    <DynamicForm
      fieldGroups={flagsGroups}
      values={config.sessionAttributes ?? {}}
      onChange={handleAttributeChange}
    />
  </TabPanel>

  <TabPanel header="HTTP API" leftIcon="pi pi-globe mr-2">
    <HttpApiForm
      config={config}
      onChange={updateRootField}
    />
  </TabPanel>

  <TabPanel header="Lua API" leftIcon="pi pi-code mr-2">
    <LuaApiForm
      config={config}
      onChange={updateRootField}
    />
  </TabPanel>
</TabView>
      </div>
    </div>
  );
};