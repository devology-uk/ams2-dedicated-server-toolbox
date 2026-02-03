import React, { useState } from 'react';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';

import type { ServerConnection, Track, Vehicle, VehicleClass, Flag } from '../types/electron';

interface DataViewerViewProps {
  connection: ServerConnection;
  onBack: () => void;
}

const DataViewerView: React.FC<DataViewerViewProps> = ({ connection, onBack }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sessionFlags, setSessionFlags] = useState<Flag[]>([]);
  const [playerFlags, setPlayerFlags] = useState<Flag[]>([]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleLoadTracks = async () => {
    setLoading('tracks');
    setError(null);

    const result = await window.electron.api.getTracks(connection.id);

    if (result.success && result.data) {
      setTracks(result.data);
      showSuccess(`Loaded ${result.data.length} tracks`);
    } else {
      setError(result.error || 'Failed to load tracks');
    }

    setLoading(null);
  };

  const handleLoadVehicles = async () => {
    setLoading('vehicles');
    setError(null);

    const result = await window.electron.api.getVehicles(connection.id);

    if (result.success && result.data) {
      setVehicles(result.data);
      showSuccess(`Loaded ${result.data.length} vehicles`);
    } else {
      setError(result.error || 'Failed to load vehicles');
    }

    setLoading(null);
  };

  const handleLoadVehicleClasses = async () => {
    setLoading('vehicleClasses');
    setError(null);

    const result = await window.electron.api.getVehicleClasses(connection.id);

    if (result.success && result.data) {
      setVehicleClasses(result.data);
      showSuccess(`Loaded ${result.data.length} vehicle classes`);
    } else {
      setError(result.error || 'Failed to load vehicle classes');
    }

    setLoading(null);
  };

  const handleLoadSessionFlags = async () => {
    setLoading('sessionFlags');
    setError(null);

    const result = await window.electron.api.getSessionFlags(connection.id);

    if (result.success && result.data) {
      setSessionFlags(result.data);
      showSuccess(`Loaded ${result.data.length} session flags`);
    } else {
      setError(result.error || 'Failed to load session flags');
    }

    setLoading(null);
  };

  const handleLoadPlayerFlags = async () => {
    setLoading('playerFlags');
    setError(null);

    const result = await window.electron.api.getPlayerFlags(connection.id);

    if (result.success && result.data) {
      setPlayerFlags(result.data);
      showSuccess(`Loaded ${result.data.length} player flags`);
    } else {
      setError(result.error || 'Failed to load player flags');
    }

    setLoading(null);
  };

  const formatDefaultDate = (track: Track) => {
    return `${track.default_day}/${track.default_month}/${track.default_year}`;
  };

  return (
    <div className="data-viewer-view">
      <div className="view-header">
        <div className="view-header-title">
          <h1>Data Viewer</h1>
          <p>Browse tracks, vehicles, and vehicle classes available on the server.</p>
        </div>
      </div>

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

        <TabPanel header={`Session Flags ${sessionFlags.length > 0 ? `(${sessionFlags.length})` : ''}`}>
          <div className="tab-actions">
            <Button
              label="Load Session Flags"
              icon={loading === 'sessionFlags' ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'}
              onClick={handleLoadSessionFlags}
              disabled={!!loading}
            />
          </div>
          {loading === 'sessionFlags' ? (
            <div className="loading-container">
              <ProgressSpinner />
            </div>
          ) : (
            <DataTable
              value={sessionFlags}
              paginator
              rows={15}
              rowsPerPageOptions={[10, 15, 25, 50]}
              emptyMessage="No session flags loaded. Click 'Load Session Flags' to fetch data."
              sortField="name"
              sortOrder={1}
              filterDisplay="row"
            >
              <Column field="name" header="Name" sortable filter filterPlaceholder="Search..." />
              <Column field="value" header="Value" sortable style={{ width: '120px' }} />
            </DataTable>
          )}
        </TabPanel>

        <TabPanel header={`Player Flags ${playerFlags.length > 0 ? `(${playerFlags.length})` : ''}`}>
          <div className="tab-actions">
            <Button
              label="Load Player Flags"
              icon={loading === 'playerFlags' ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'}
              onClick={handleLoadPlayerFlags}
              disabled={!!loading}
            />
          </div>
          {loading === 'playerFlags' ? (
            <div className="loading-container">
              <ProgressSpinner />
            </div>
          ) : (
            <DataTable
              value={playerFlags}
              paginator
              rows={15}
              rowsPerPageOptions={[10, 15, 25, 50]}
              emptyMessage="No player flags loaded. Click 'Load Player Flags' to fetch data."
              sortField="name"
              sortOrder={1}
              filterDisplay="row"
            >
              <Column field="name" header="Name" sortable filter filterPlaceholder="Search..." />
              <Column field="value" header="Value" sortable style={{ width: '120px' }} />
            </DataTable>
          )}
        </TabPanel>
      </TabView>
    </div>
  );
};

export default DataViewerView;