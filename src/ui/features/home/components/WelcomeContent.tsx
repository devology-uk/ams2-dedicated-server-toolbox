import { useState, useEffect } from 'react';

import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

import type { ServerConnection } from '../../../../shared/types/index.js';
import { ServerConnectionDialog } from '../../../components/ServerConnectionDialog.js';

interface WelcomeContentProps {
  onServerSelect: (connection: ServerConnection) => void;
}

export const WelcomeContent = ({ onServerSelect }: WelcomeContentProps) => {
  const [connections, setConnections] = useState<ServerConnection[]>([]);
  const [isDialogVisible, setIsDialogVisible] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const conns = await window.electron.getConnections();
    setConnections(conns);
  };

  const handleDialogSave = () => {
    setIsDialogVisible(false);
    loadConnections();
  };

  return (
    <div className="welcome-view">
      <div className="welcome-header">
        <i className="pi pi-car welcome-icon"></i>
        <h1>AMS2 Dedicated Server Toolbox</h1>
        <p className="welcome-description">
          Manage your Automobilista 2 dedicated servers with ease. 
          Configure sessions, browse API data, and export 
          server configurations ready for deployment.
        </p>
      </div>

      <div className="welcome-servers">
        <h2>
          <i className="pi pi-server"></i>
          Your Servers
        </h2>

        {connections.length > 0 ? (
          <div className="server-list">
            {connections.map((connection) => (
              <Card 
                key={connection.id} 
                className="server-card"
                onClick={() => onServerSelect(connection)}
              >
                <div className="server-card-content">
                  <div className="server-card-info">
                    <h3>{connection.name}</h3>
                    <p className="server-card-address">
                      <i className="pi pi-globe"></i>
                      {connection.ipAddress}:{connection.port}
                    </p>
                  </div>
                  <i className="pi pi-chevron-right server-card-arrow"></i>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="no-servers">
            <i className="pi pi-inbox"></i>
            <p>No servers configured yet</p>
          </div>
        )}

        <Button
          label="Add New Server"
          icon="pi pi-plus"
          className="add-server-button"
          onClick={() => setIsDialogVisible(true)}
        />
      </div>

      <ServerConnectionDialog
        visible={isDialogVisible}
        onHide={() => setIsDialogVisible(false)}
        onSave={handleDialogSave}
        connection={null}
      />
    </div>
  );
};