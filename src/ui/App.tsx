import React, { useState, useEffect } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import Titlebar from './components/Titlebar';
import WelcomeView from './views/WelcomeView';
import ServerHomeView from './views/ServerHomeView';
import DataViewerView from './views/DataViewerView';
import ConfigBuilderView from './views/ConfigBuilderView';
import type { ServerConnection } from './types/electron';
import type { AppView } from './types/navigation';
import './styles/index.scss';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [activeConnection, setActiveConnection] = useState<ServerConnection | null>(null);

  useEffect(() => {
    loadActiveConnection();
  }, []);

  const loadActiveConnection = async () => {
    const connection = await window.electron.getActiveConnection();
    setActiveConnection(connection);
    
    // If we have an active connection, go to server home
    if (connection) {
      setCurrentView('server-home');
    }
  };

  const handleServerSelect = async (connection: ServerConnection) => {
    await window.electron.setActiveConnection(connection.id);
    setActiveConnection(connection);
    setCurrentView('server-home');
  };

  const handleBackToWelcome = async () => {
    await window.electron.setActiveConnection(null);
    setActiveConnection(null);
    setCurrentView('welcome');
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'welcome':
        return (
          <WelcomeView
            onServerSelect={handleServerSelect}
          />
        );
      case 'server-home':
        return activeConnection ? (
          <ServerHomeView
            connection={activeConnection}
            onNavigate={handleNavigate}
            onDisconnect={handleBackToWelcome}
          />
        ) : (
          <WelcomeView onServerSelect={handleServerSelect} />
        );
      case 'data-viewer':
        return activeConnection ? (
          <DataViewerView
            connection={activeConnection}
            onBack={() => handleNavigate('server-home')}
          />
        ) : (
          <WelcomeView onServerSelect={handleServerSelect} />
        );
      case 'config-builder':
        return activeConnection ? (
          <ConfigBuilderView
            connection={activeConnection}
            onBack={() => handleNavigate('server-home')}
          />
        ) : (
          <WelcomeView onServerSelect={handleServerSelect} />
        );
      default:
        return <WelcomeView onServerSelect={handleServerSelect} />;
    }
  };

  return (
    <PrimeReactProvider>
      <div className="app">
        <Titlebar 
          title="AMS2 Dedicated Server Toolbox" 
          showBackButton={currentView !== 'welcome'}
          onBack={currentView === 'server-home' ? handleBackToWelcome : () => handleNavigate('server-home')}
        />
        <div className="app-content">
          {renderView()}
        </div>
      </div>
    </PrimeReactProvider>
  );
};

export default App;