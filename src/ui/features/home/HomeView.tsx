import { useState, useEffect } from 'react';

import { WelcomeContent } from './components/WelcomeContent.js';
import { ServerDashboard } from './components/ServerDashboard.js';
import { ConfigBuilderView } from '../config-builder/ConfigBuilderView';
import { StatsViewer } from '../stats/StatsViewer';
import { ApiExplorerView } from '../api-explorer/ApiExplorerView';
import type { ServerConnection } from '../../../shared/types/connections';
import type { ActiveFeature } from '../../types/ActiveFeature.js';


interface HomeViewProps {
  onActiveFeatureChanged: (feature: ActiveFeature) => void;
  activeFeature: ActiveFeature;
}

export const HomeView = ({onActiveFeatureChanged, activeFeature}: HomeViewProps) => {
  const [activeConnection, setActiveConnection] = useState<ServerConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveConnection();
  }, []);

  const loadActiveConnection = async () => {
    try {
      const connection = await window.electron.getActiveConnection();
      setActiveConnection(connection);
    } catch (error) {
      console.error('Failed to load active connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionCreated = (connection: ServerConnection) => {
    setActiveConnection(connection);
  };

  const handleBackToHome = () => {
    onActiveFeatureChanged('home');
  };

  if (loading) {
    return <div className="home-view__loading">Loading...</div>;
  }

  // No connection - show welcome
  if (!activeConnection) {
    return <WelcomeContent onServerSelect={handleConnectionCreated} />;
  }

  // Render active feature
  switch (activeFeature) {
    case 'config':
      return <ConfigBuilderView connectionId={activeConnection.id} onBack={handleBackToHome} />;
    case 'stats':
      return <StatsViewer onBack={handleBackToHome} />;
    case 'api':
      return <ApiExplorerView onBack={handleBackToHome} connection={activeConnection} />;
    default:
      return (
        <ServerDashboard
          connection={activeConnection}
          onFeatureSelect={(f) => {
            onActiveFeatureChanged(f);
          }}
        />
      );
  }
};