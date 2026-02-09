import React from 'react';

import type { ServerConnection } from '../../../../shared/types/index.js';
import { FeatureTile } from './FeatureTile';

type FeatureType = 'config' | 'stats' | 'api';

interface ServerDashboardProps {
  connection: ServerConnection;
  onFeatureSelect: (feature: FeatureType) => void;
}

export const ServerDashboard: React.FC<ServerDashboardProps> = ({
  connection,
  onFeatureSelect,
}) => {
  return (
    <div className="server-dashboard">
      <header className="server-dashboard__header">
        <h1>{connection.name}</h1>
        <span className="server-dashboard__address">
          {connection.ipAddress}:{connection.port}
        </span>
      </header>

      <div className="server-dashboard__tiles">
        <FeatureTile
          title="Configuration Builder"
          description="Create and edit server configuration files"
          icon="pi pi-cog"
          onClick={() => onFeatureSelect('config')}
        />
        <FeatureTile
          title="Stats Viewer"
          description="View server statistics and player data"
          icon="pi pi-chart-bar"
          onClick={() => onFeatureSelect('stats')}
        />
        <FeatureTile
          title="API Explorer"
          description="Explore and test the server API"
          icon="pi pi-code"
          onClick={() => onFeatureSelect('api')}
        />
      </div>
    </div>
  );
};