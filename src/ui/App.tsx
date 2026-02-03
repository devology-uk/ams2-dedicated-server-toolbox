import React, { useState, useEffect } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import Titlebar from './components/Titlebar';
import type { ServerConnection, Track, Vehicle, VehicleClass } from './types/electron';
import './styles/index.scss';

const App: React.FC = () => {
  const [activeConnection, setActiveConnection] = useState<ServerConnection | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadActiveConnection();
  }, []);

  const loadActiveConnection = async () => {
    const connection = await window.electron.getActiveConnection();
    setActiveConnection(connection);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    if (!activeConnection) return;

    setLoading('test');
    setError(null);
    setSuccessMessage(null);

    const result = await window.electron.api.testConnection(activeConnection.id);

    if (result.success) {
      showSuccess('Connection successful!');
    } else {
      setError(result.error || 'Connection test failed');
    }

    setLoading(null);
  };

  const handleLoadTracks = async () => {
    if (!activeConnection) return;

    setLoading('tracks');
    setError(null);

    const result = await window.electron.api.getTracks(activeConnection.id);

    if (result.success && result.data) {
      setTracks(result.data);
      showSuccess(`Loaded ${result.data.length} tracks`);
    } else {
      setError(result.error || 'Failed to load tracks');
    }

    setLoading(null);
  };

  const handleLoadVehicles = async () => {
    if (!activeConnection) return;

    setLoading('vehicles');
    setError(null);

    const result = await window.electron.api.getVehicles(activeConnection.id);

    if (result.success && result.data) {
      setVehicles(result.data);
      showSuccess(`Loaded ${result.data.length} vehicles`);
    } else {
      setError(result.error || 'Failed to load vehicles');
    }

    setLoading(null);
  };

  const handleLoadVehicleClasses = async () => {
    if (!activeConnection) return;

    setLoading('vehicleClasses');
    setError(null);

    const result = await window.electron.api.getVehicleClasses(activeConnection.id);

    if (result.success && result.data) {
      setVehicleClasses(result.data);
      showSuccess(`Loaded ${result.data.length} vehicle classes`);
    } else {
      setError(result.error || 'Failed to load vehicle classes');
    }

    setLoading(null);
  };

  // Listen for connection changes from Titlebar
  useEffect(() => {
    const interval = setInterval(loadActiveConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format default date for tracks
  const formatDefaultDate = (track: Track) => {
    return `${track.default_day}/${track.default_month}/${track.default_year}`;
  };

  return (
    <PrimeReactProvider>
      <div className="app">
        <Titlebar title="AMS2 Server Manager" />
        <div className="app-content">
          {!activeConnection ? (
            <Card>
              <div className="no-connection">
                <i className="pi pi-server" style={{ fontSize: '3rem', color: 'var(--text-color-secondary)' }}></i>
                <h2>No Server Selected</h2>
                <p>Click the server icon in the titlebar to add or select a server connection.</p>
              </div>
            </Card>
          ) : (
            <>
              <Card className="connection-card">
                <div className="connection-header">
                  <div className="connection-info">
                    <h2>{activeConnection.name}</h2>
                    <p>{activeConnection.ipAddress}:{activeConnection.port}</p>
                  </div>
                  <Button
                    label="Test Connection"
                    icon={loading === 'test' ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'}
                    onClick={handleTestConnection}
                    disabled={!!loading}
                  />
                </div>
              </Card>

              {error && (
                <Message severity="error" text={error} className="status-message" />
              )}

              {successMessage && (
                <Message severity="success" text={successMessage} className="status-message" />
              )}

              <TabView className="data-tabs">
                <TabPanel header={`Tracks ${tracks.length > 0 ? `(${tracks.length})` : ''}`}>
                  <div className="tab-actions">
                    <Button
                      label="Load Tracks"
                      icon={loading === 'tracks' ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'}
                      onClick={handleLoadTracks}
                      disabled={!!loading}
                    />
                  </div>
                  {loading === 'tracks' ? (
                    <div className="loading-container">
                      <ProgressSpinner />
                    </div>
                  ) : (
                    <DataTable
                      value={tracks}
                      paginator
                      rows={15}
                      rowsPerPageOptions={[10, 15, 25, 50]}
                      emptyMessage="No tracks loaded. Click 'Load Tracks' to fetch data."
                      sortField="name"
                      sortOrder={1}
                      filterDisplay="row"
                    >
                      <Column field="id" header="ID" sortable style={{ width: '120px' }} />
                      <Column field="name" header="Name" sortable filter filterPlaceholder="Search..." />
                      <Column field="gridsize" header="Grid Size" sortable style={{ width: '120px' }} />
                      <Column header="Default Date" body={formatDefaultDate} style={{ width: '140px' }} />
                    </DataTable>
                  )}
                </TabPanel>

                <TabPanel header={`Vehicles ${vehicles.length > 0 ? `(${vehicles.length})` : ''}`}>
                  <div className="tab-actions">
                    <Button
                      label="Load Vehicles"
                      icon={loading === 'vehicles' ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'}
                      onClick={handleLoadVehicles}
                      disabled={!!loading}
                    />
                  </div>
                  {loading === 'vehicles' ? (
                    <div className="loading-container">
                      <ProgressSpinner />
                    </div>
                  ) : (
                    <DataTable
                      value={vehicles}
                      paginator
                      rows={15}
                      rowsPerPageOptions={[10, 15, 25, 50]}
                      emptyMessage="No vehicles loaded. Click 'Load Vehicles' to fetch data."
                      sortField="name"
                      sortOrder={1}
                      filterDisplay="row"
                    >
                      <Column field="id" header="ID" sortable style={{ width: '120px' }} />
                      <Column field="name" header="Name" sortable filter filterPlaceholder="Search..." />
                      <Column field="class" header="Class" sortable filter filterPlaceholder="Filter..." style={{ width: '180px' }} />
                    </DataTable>
                  )}
                </TabPanel>

                <TabPanel header={`Vehicle Classes ${vehicleClasses.length > 0 ? `(${vehicleClasses.length})` : ''}`}>
                  <div className="tab-actions">
                    <Button
                      label="Load Vehicle Classes"
                      icon={loading === 'vehicleClasses' ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'}
                      onClick={handleLoadVehicleClasses}
                      disabled={!!loading}
                    />
                  </div>
                  {loading === 'vehicleClasses' ? (
                    <div className="loading-container">
                      <ProgressSpinner />
                    </div>
                  ) : (
                    <DataTable
                      value={vehicleClasses}
                      paginator
                      rows={15}
                      rowsPerPageOptions={[10, 15, 25, 50]}
                      emptyMessage="No vehicle classes loaded. Click 'Load Vehicle Classes' to fetch data."
                      sortField="translated_name"
                      sortOrder={1}
                      filterDisplay="row"
                    >
                      <Column field="value" header="ID" sortable style={{ width: '120px' }} />
                      <Column field="name" header="Name" sortable filter filterPlaceholder="Search..." />
                      <Column field="translated_name" header="Display Name" sortable filter filterPlaceholder="Search..." />
                    </DataTable>
                  )}
                </TabPanel>
              </TabView>
            </>
          )}
        </div>
      </div>
    </PrimeReactProvider>
  );
};

export default App;