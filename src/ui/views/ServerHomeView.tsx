import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import type { ServerConnection } from '../types/electron';
import type { AppView } from '../types/navigation';

interface ServerHomeViewProps {
  connection: ServerConnection;
  onNavigate: (view: AppView) => void;
  onDisconnect: () => void;
}

const ServerHomeView: React.FC<ServerHomeViewProps> = ({
  connection,
  onNavigate,
  onDisconnect,
}) => {
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus('idle');
    setErrorMessage(null);

    const result = await window.electron.api.testConnection(connection.id);

    if (result.success) {
      setConnectionStatus('success');
    } else {
      setConnectionStatus('error');
      setErrorMessage(result.error || 'Connection failed');
    }

    setTesting(false);
  };

  return (
    <div className="server-home-view">
      {/* Server Banner */}
      <Card className="server-banner">
        <div className="server-banner-content">
          <div className="server-banner-info">
            <h1>{connection.name}</h1>
            <p className="server-banner-address">
              <i className="pi pi-globe"></i>
              {connection.ipAddress}:{connection.port}
            </p>
          </div>
          <div className="server-banner-actions">
            <Button
              label="Test Connection"
              icon={testing ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'}
              className="p-button-outlined"
              onClick={handleTestConnection}
              disabled={testing}
            />
            <Button
              label="Disconnect"
              icon="pi pi-sign-out"
              className="p-button-outlined p-button-secondary"
              onClick={onDisconnect}
            />
          </div>
        </div>
        
        {connectionStatus === 'success' && (
          <Message severity="success" text="Connection successful!" className="server-banner-message" />
        )}
        {connectionStatus === 'error' && (
          <Message severity="error" text={errorMessage || 'Connection failed'} className="server-banner-message" />
        )}
      </Card>

      {/* Navigation Tiles */}
      <div className="server-home-tiles">
        <Card 
          className="home-tile home-tile-config"
          onClick={() => onNavigate('config-builder')}
        >
          <div className="home-tile-content">
            <div className="home-tile-icon">
              <i className="pi pi-cog"></i>
            </div>
            <div className="home-tile-info">
              <h2>Configuration Builder</h2>
              <p>Create and edit server configurations. Import existing configs or build new ones from scratch.</p>
            </div>
            <i className="pi pi-chevron-right home-tile-arrow"></i>
          </div>
        </Card>

        <Card 
          className="home-tile home-tile-explorer"
          onClick={() => onNavigate('api-explorer')}
        >
          <div className="home-tile-content">
            <div className="home-tile-icon">
              <i className="pi pi-sitemap"></i>
            </div>
            <div className="home-tile-info">
              <h2>API Explorer</h2>
              <p>Browse and explore all available server API endpoints. View tracks, vehicles, settings, and more.</p>
            </div>
            <i className="pi pi-chevron-right home-tile-arrow"></i>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ServerHomeView;