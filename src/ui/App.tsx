import React, { useState, useEffect } from 'react';
import './styles/index.scss';

import { PrimeReactProvider } from 'primereact/api';

import type { AppView } from './types/navigation';
import type { ServerConnection } from './types/electron';

import ApiExplorerView from './views/ApiExplorerView';
import { ConfigBuilderView } from './features/config-builder/components';
import ServerHomeView from './views/ServerHomeView';
import Titlebar from './components/Titlebar';
import WelcomeView from './views/WelcomeView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [activeConnection, setActiveConnection] = useState<ServerConnection | null>(null);

  useEffect(() => {
    loadActiveConnection();
  }, []);

  const loadActiveConnection = async () => {
    const connection = await window.electron.getActiveConnection();
    setActiveConnection(connection);
    
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
      case 'config-builder':
        return activeConnection ? (
          <ConfigBuilderView
            connectionId={activeConnection.id}
          />
        ) : (
          <WelcomeView onServerSelect={handleServerSelect} />
        );
      case 'api-explorer':
        return activeConnection ? (
          <ApiExplorerView
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