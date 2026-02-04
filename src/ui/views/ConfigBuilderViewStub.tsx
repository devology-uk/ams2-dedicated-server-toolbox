import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import TrackSelector from './TrackSelector';
import type { ServerConnection, Track } from '../types/electron';

interface ConfigBuilderViewProps {
  connection: ServerConnection;
  onBack: () => void;
}

const ConfigBuilderView: React.FC<ConfigBuilderViewProps> = ({ connection, onBack }) => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null);
  };

  const handleImportConfig = async () => {
    try {
      const result = await window.electron.importConfig();
      
      if (result.success && result.data) {
        // TODO: Parse and load the config data
        showSuccess(`Imported configuration from ${result.filename}`);
        console.log('Imported config:', result.data);
      } else if (result.cancelled) {
        // User cancelled, do nothing
      } else {
        showError(result.error || 'Failed to import configuration');
      }
    } catch (error) {
      showError('Failed to import configuration');
      console.error('Import error:', error);
    }
  };

  const handleExportConfig = async () => {
    try {
      // TODO: Build the actual config object from form state
      const configData = buildConfigString();
      
      const result = await window.electron.exportConfig(configData);
      
      if (result.success) {
        showSuccess(`Configuration exported to ${result.filename}`);
      } else if (result.cancelled) {
        // User cancelled, do nothing
      } else {
        showError(result.error || 'Failed to export configuration');
      }
    } catch (error) {
      showError('Failed to export configuration');
      console.error('Export error:', error);
    }
  };

  const buildConfigString = (): string => {
    // TODO: Build actual config from form state
    // This is a placeholder example
    const lines: string[] = [];
    
    if (selectedTrack) {
      lines.push(`track=${selectedTrack.name}`);
    }
    
    // Add more config options as you build them
    
    return lines.join('\n');
  };

  return (
    <div className="config-builder-view">
      <div className="view-header">
        <div className="view-header-title">
          <h1>Configuration Builder</h1>
          <p>Create and customize your server configuration.</p>
        </div>
        <div className="view-header-actions">
          <Button
            label="Import Config"
            icon="pi pi-upload"
            className="p-button-outlined"
            onClick={handleImportConfig}
          />
          <Button
            label="Export Config"
            icon="pi pi-download"
            onClick={handleExportConfig}
          />
        </div>
      </div>

      {successMessage && (
        <Message severity="success" text={successMessage} className="status-message" />
      )}

      {errorMessage && (
        <Message severity="error" text={errorMessage} className="status-message" />
      )}

      <Card className="config-section">
        <h2>
          <i className="pi pi-map"></i>
          Track Selection
        </h2>
        <Divider />
        
        <div className="selector-field">
          <label htmlFor="track">Track Layout</label>
          <TrackSelector
            value={selectedTrack}
            onChange={setSelectedTrack}
            connectionId={connection.id}
            placeholder="Choose a track layout..."
          />
          {selectedTrack && (
            <div className="selector-help">
              Grid size: {selectedTrack.gridsize} slots | 
              Default date: {selectedTrack.default_day}/{selectedTrack.default_month}/{selectedTrack.default_year}
            </div>
          )}
        </div>
      </Card>

      {/* Placeholder for more config sections */}
      <Card className="config-section config-section-placeholder">
        <h2>
          <i className="pi pi-car"></i>
          Vehicle Selection
        </h2>
        <Divider />
        <p className="placeholder-text">Vehicle selection options will go here...</p>
      </Card>

      <Card className="config-section config-section-placeholder">
        <h2>
          <i className="pi pi-sliders-h"></i>
          Session Settings
        </h2>
        <Divider />
        <p className="placeholder-text">Session configuration options will go here...</p>
      </Card>
    </div>
  );
};

export default ConfigBuilderView;