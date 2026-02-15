// src/ui/features/api-explorer/ApiExplorerView.tsx

import { useState, useEffect, useRef } from 'react';

import { Tree } from 'primereact/tree';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dropdown } from 'primereact/dropdown';
import { Menu } from 'primereact/menu';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import type { TreeNode } from 'primereact/treenode';
import type { TreeExpandedKeysType } from 'primereact/tree';
import type { MenuItem } from 'primereact/menuitem';

import './ApiExplorerView.scss';
import { ServerConnectionDialog } from '../../components/ServerConnectionDialog';
import type {
  ServerConnection,
  ServerCache,
  ServerVersion,
  ApiListData,
} from '../../../shared/types/index.js';

interface VersionApiResponse {
  result: string;
  response: ServerVersion;
}

const API_STRUCTURE: { path: string; label: string; icon: string; category?: string }[] = [
  // Attributes
  { path: 'attributes/session', label: 'Session Attributes', icon: 'pi pi-cog', category: 'Attributes' },
  { path: 'attributes/member', label: 'Member Attributes', icon: 'pi pi-user', category: 'Attributes' },
  { path: 'attributes/participant', label: 'Participant Attributes', icon: 'pi pi-users', category: 'Attributes' },

  // Core Data
  { path: 'events', label: 'Events', icon: 'pi pi-calendar', category: 'Core Data' },
  { path: 'vehicle_classes', label: 'Vehicle Classes', icon: 'pi pi-tags', category: 'Core Data' },
  { path: 'vehicles', label: 'Vehicles', icon: 'pi pi-car', category: 'Core Data' },
  { path: 'liveries', label: 'Liveries', icon: 'pi pi-palette', category: 'Core Data' },
  { path: 'tracks', label: 'Tracks', icon: 'pi pi-map', category: 'Core Data' },

  // Enums
  { path: 'enums/damage', label: 'Damage', icon: 'pi pi-exclamation-triangle', category: 'Enums' },
  { path: 'enums/damage_scale', label: 'Damage Scale', icon: 'pi pi-sliders-h', category: 'Enums' },
  { path: 'enums/random_failures', label: 'Random Failures', icon: 'pi pi-bolt', category: 'Enums' },
  { path: 'enums/tire_wear', label: 'Tire Wear', icon: 'pi pi-circle', category: 'Enums' },
  { path: 'enums/fuel_usage', label: 'Fuel Usage', icon: 'pi pi-gauge', category: 'Enums' },
  { path: 'enums/penalties', label: 'Penalties', icon: 'pi pi-ban', category: 'Enums' },
  { path: 'enums/game_mode', label: 'Game Mode', icon: 'pi pi-play', category: 'Enums' },
  { path: 'enums/allowed_view', label: 'Allowed View', icon: 'pi pi-eye', category: 'Enums' },
  { path: 'enums/weather', label: 'Weather', icon: 'pi pi-cloud', category: 'Enums' },
  { path: 'enums/grid_positions', label: 'Grid Positions', icon: 'pi pi-th-large', category: 'Enums' },
  { path: 'enums/pit_control', label: 'Pit Control', icon: 'pi pi-wrench', category: 'Enums' },
  { path: 'enums/online_rep', label: 'Online Reputation', icon: 'pi pi-star', category: 'Enums' },
  { path: 'enums/livetrack_preset', label: 'LiveTrack Preset', icon: 'pi pi-sun', category: 'Enums' },
  { path: 'enums/scheduledfcy', label: 'Scheduled FCY', icon: 'pi pi-flag', category: 'Enums' },

  // Flags
  { path: 'flags/session', label: 'Session Flags', icon: 'pi pi-flag-fill', category: 'Flags' },
  { path: 'flags/player', label: 'Player Flags', icon: 'pi pi-flag', category: 'Flags' },
];

export const ApiExplorerView = () => {
  const toast = useRef<Toast>(null);

  // =============================================
  // Connection state (self-contained)
  // =============================================
  const [connections, setConnections] = useState<ServerConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<ServerConnection | null>(null);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ServerConnection | null>(null);
  const connectionMenuRef = useRef<Menu>(null);

  // =============================================
  // Cache / API state (from original)
  // =============================================
  const [cache, setCache] = useState<ServerCache | null>(null);
  const [, setServerVersion] = useState<ServerVersion | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'valid' | 'stale' | 'none' | 'error'>('none');

  // UI state
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [selectedListData, setSelectedListData] = useState<ApiListData | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({ root: true });

  // =============================================
  // Connection management
  // =============================================

  useEffect(() => {
    loadConnections();
  }, []);

  // When active connection changes, re-initialize cache
  useEffect(() => {
    if (activeConnection) {
      initializeCache();
    } else {
      setCache(null);
      setCacheStatus('none');
      setSelectedNode(null);
      setSelectedListData(null);
    }
  }, [activeConnection?.id]);

  const loadConnections = async () => {
    try {
      const conns = await window.electron.getConnections();
      setConnections(conns);

      const active = await window.electron.getActiveConnection();
      if (active) {
        setActiveConnection(active);
      } else if (conns.length > 0) {
        setActiveConnection(conns[0]);
        await window.electron.setActiveConnection(conns[0].id);
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handleConnectionChange = async (connection: ServerConnection) => {
    setActiveConnection(connection);
    setError(null);
    setSelectedNode(null);
    setSelectedListData(null);
    await window.electron.setActiveConnection(connection.id);
  };

  const handleAddConnection = () => {
    setEditingConnection(null);
    setDialogVisible(true);
  };

  const handleEditConnection = () => {
    if (activeConnection) {
      setEditingConnection(activeConnection);
      setDialogVisible(true);
    }
  };

  const handleDeleteConnection = () => {
    if (!activeConnection) return;

    confirmDialog({
      message: `Delete "${activeConnection.name}"? This will remove the saved connection details.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        await window.electron.deleteConnection(activeConnection.id);
        setActiveConnection(null);
        setCacheStatus('none');
        await loadConnections();
      },
    });
  };

  const handleDialogSave = async () => {
    setDialogVisible(false);
    setEditingConnection(null);
    await loadConnections();
  };

  const connectionMenuItems: MenuItem[] = [
    {
      label: 'Edit Connection',
      icon: 'pi pi-pencil',
      command: handleEditConnection,
      disabled: !activeConnection,
    },
    { separator: true },
    {
      label: 'Delete Connection',
      icon: 'pi pi-trash',
      className: 'p-menuitem-danger',
      command: handleDeleteConnection,
      disabled: !activeConnection,
    },
  ];

  // =============================================
  // Cache initialization & sync (from original)
  // =============================================

  const initializeCache = async () => {
    if (!activeConnection) return;

    setCacheStatus('loading');
    setError(null);

    try {
      const existingCache = await window.electron.cache.get(activeConnection.id);
      const versionResult = await window.electron.api.getVersion(activeConnection.id);

      if (versionResult.success && versionResult.data) {
        const versionData = (versionResult.data as unknown as VersionApiResponse).response;
        setServerVersion(versionData);

        if (existingCache) {
          if (existingCache.version.build_version === versionData.build_version) {
            setCache(existingCache);
            setCacheStatus('valid');
          } else {
            setCache(existingCache);
            setCacheStatus('stale');
          }
        } else {
          setCacheStatus('none');
        }
      } else {
        if (existingCache) {
          setCache(existingCache);
          setCacheStatus('valid');
          setError('Server unreachable. Using cached data.');
        } else {
          setCacheStatus('error');
          setError('Server unreachable and no cached data available.');
        }
      }
    } catch {
      setCacheStatus('error');
      setError('Failed to initialize. Please try again.');
    }
  };

  const syncFromServer = async () => {
    if (!activeConnection) return;

    setSyncing(true);
    setError(null);

    try {
      const versionResult = await window.electron.api.getVersion(activeConnection.id);

      if (!versionResult.success || !versionResult.data) {
        setError(versionResult.error || 'Failed to get server version');
        setSyncing(false);
        return;
      }

      const versionData = (versionResult.data as unknown as VersionApiResponse).response;

      const listsResult = await window.electron.api.getAllLists(activeConnection.id);

      if (!listsResult.success || !listsResult.data) {
        setError(listsResult.error || 'Failed to fetch data from server');
        setSyncing(false);
        return;
      }

      const cacheData = {
        version: versionData,
        lists: listsResult.data,
      };

      // Save to per-connection cache (for API Explorer)
      await window.electron.cache.set(activeConnection.id, cacheData);

      // Also update shared game data (for Config Builder)
      await window.electron.gameData.set(
        cacheData,
        `synced-${activeConnection.name}-${versionData.build_version}`,
      );

      const newCache: ServerCache = {
        version: versionData,
        syncedAt: Date.now(),
        lists: listsResult.data,
      };

      setCache(newCache);
      setServerVersion(versionData);
      setCacheStatus('valid');
      setSelectedListData(null);
      setSelectedNode(null);

      toast.current?.show({
        severity: 'success',
        summary: 'Sync Complete',
        detail: 'Game data updated. Config Builder will use this data.',
        life: 3000,
      });
    } catch (err) {
      console.error('[Sync] Error:', err);
      setError('Sync failed. Please try again.');
    }

    setSyncing(false);
  };

  const handleSyncClick = () => {
    if (cacheStatus === 'stale') {
      confirmDialog({
        message: 'Server version has changed. Do you want to refresh all cached data?',
        header: 'Update Available',
        icon: 'pi pi-refresh',
        acceptLabel: 'Sync Now',
        rejectLabel: 'Keep Current',
        accept: syncFromServer,
      });
    } else {
      syncFromServer();
    }
  };

  // =============================================
  // Tree & data display (from original)
  // =============================================

  const formatSyncTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const buildTreeNodes = (): TreeNode[] => {
    const categories = new Map<string, typeof API_STRUCTURE>();

    API_STRUCTURE.forEach((item) => {
      const category = item.category || 'Other';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(item);
    });

    const categoryNodes: TreeNode[] = Array.from(categories.entries()).map(
      ([category, items]) => ({
        key: `category-${category}`,
        label: category,
        icon: getCategoryIcon(category),
        data: { type: 'category', category },
        selectable: false,
        children: items.map((item) => ({
          key: `list-${item.path}`,
          label: item.label,
          icon: item.icon,
          data: {
            type: 'list',
            path: item.path,
            label: item.label,
          },
        })),
      }),
    );

    return [
      {
        key: 'root',
        label: 'API Endpoints',
        icon: 'pi pi-server',
        data: { type: 'root' },
        selectable: false,
        children: categoryNodes,
      },
    ];
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      Attributes: 'pi pi-sliders-h',
      'Core Data': 'pi pi-database',
      Enums: 'pi pi-list',
      Flags: 'pi pi-flag',
    };
    return icons[category] || 'pi pi-folder';
  };

  const handleNodeSelect = async (node: TreeNode) => {
    if (!activeConnection) return;

    setSelectedNode(node);

    if (node.data?.type === 'list') {
      const path = node.data.path as string;

      const currentCache = await window.electron.cache.get(activeConnection.id);

      if (currentCache?.lists[path]) {
        setSelectedListData(currentCache.lists[path]);
        return;
      }

      setError(null);
      const result = await window.electron.api.getListByPath(activeConnection.id, path);

      if (result.success && result.data) {
        setSelectedListData(result.data);
      } else {
        setError(result.error || 'Failed to load data');
        setSelectedListData(null);
      }
    } else {
      setSelectedListData(null);
    }
  };

  const getColumnsForData = (data: Record<string, unknown>[]): string[] => {
    if (!data || data.length === 0) return [];

    const allKeys = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => allKeys.add(key));
    });

    const priorityColumns = [
      'id', 'value', 'name', 'translated_name', 'class', 'gridsize', 'description', 'label',
    ];
    return Array.from(allKeys).sort((a, b) => {
      const aIndex = priorityColumns.indexOf(a);
      const bIndex = priorityColumns.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  };

  const formatColumnHeader = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const filterTree = (nodes: TreeNode[], filter: string): TreeNode[] => {
    if (!filter) return nodes;

    const lowerFilter = filter.toLowerCase();
    const result: TreeNode[] = [];

    for (const node of nodes) {
      const labelMatch = node.label?.toLowerCase().includes(lowerFilter);
      const filteredChildren = node.children ? filterTree(node.children, filter) : [];

      if (labelMatch || filteredChildren.length > 0) {
        result.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        });
      }
    }

    return result;
  };

  const treeNodes = buildTreeNodes();
  const filteredNodes = filterTree(treeNodes, filterValue);

  // =============================================
  // Render
  // =============================================

  if (connectionsLoading) {
    return (
      <div className="api-explorer-view">
        <div className="loading-container">
          <ProgressSpinner />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // No connections — prompt to add one
  if (connections.length === 0) {
    return (
      <div className="flex flex-column align-items-center justify-content-center gap-4 p-6">
        <i className="pi pi-code text-6xl text-primary" />
        <h2 className="m-0">API Explorer</h2>
        <p className="text-color-secondary m-0 text-center" style={{ maxWidth: '30rem' }}>
          Connect to a running AMS2 dedicated server to explore its HTTP API.
          You'll need the server's IP address, port, and admin credentials.
        </p>
        <Button
          label="Add Server Connection"
          icon="pi pi-plus"
          onClick={handleAddConnection}
          size="large"
        />
        <ServerConnectionDialog
          visible={dialogVisible}
          onHide={() => setDialogVisible(false)}
          onSave={handleDialogSave}
          connection={null}
        />
      </div>
    );
  }

  // Connection bar (shown in all connected states)
  const connectionBar = (
    <div className="flex align-items-center gap-2 mb-3 flex-wrap">
      <i className="pi pi-server text-xl text-primary" />
      <Dropdown
        value={activeConnection}
        options={connections}
        onChange={(e) => handleConnectionChange(e.value)}
        optionLabel="name"
        placeholder="Select server..."
        className="w-20rem"
        dataKey="id"
        itemTemplate={(option: ServerConnection) => (
          <div className="flex flex-column">
            <span className="font-semibold">{option.name}</span>
            <span className="text-color-secondary text-xs">
              {option.ipAddress}:{option.port}
            </span>
          </div>
        )}
      />
      <Button
        icon="pi pi-plus"
        onClick={handleAddConnection}
        outlined
        tooltip="Add connection"
        tooltipOptions={{ position: 'bottom' }}
      />
      <Button
        icon="pi pi-ellipsis-v"
        onClick={(e) => connectionMenuRef.current?.toggle(e)}
        text
        tooltip="Connection options"
        tooltipOptions={{ position: 'bottom' }}
      />
      <Menu model={connectionMenuItems} popup ref={connectionMenuRef} />

      {activeConnection && (
        <span className="text-color-secondary text-sm ml-auto">
          {activeConnection.ipAddress}:{activeConnection.port}
        </span>
      )}
    </div>
  );

  // No connection selected
  if (!activeConnection) {
    return (
      <div className="api-explorer-view">
        <Toast ref={toast} />
        <ConfirmDialog />
        {connectionBar}
        <Message severity="info" text="Select a server connection above to begin" className="w-full" />
        <ServerConnectionDialog
          visible={dialogVisible}
          onHide={() => { setDialogVisible(false); setEditingConnection(null); }}
          onSave={handleDialogSave}
          connection={editingConnection}
        />
      </div>
    );
  }

  // Cache loading
  if (cacheStatus === 'loading') {
    return (
      <div className="api-explorer-view">
        <Toast ref={toast} />
        <ConfirmDialog />
        {connectionBar}
        <div className="loading-container">
          <ProgressSpinner />
          <p>Checking server connection...</p>
        </div>
        <ServerConnectionDialog
          visible={dialogVisible}
          onHide={() => { setDialogVisible(false); setEditingConnection(null); }}
          onSave={handleDialogSave}
          connection={editingConnection}
        />
      </div>
    );
  }

  // Need initial sync
  if (cacheStatus === 'none' || (cacheStatus === 'error' && !cache)) {
    return (
      <div className="api-explorer-view">
        <Toast ref={toast} />
        <ConfirmDialog />
        {connectionBar}

        {error && <Message severity="error" text={error} className="status-message mb-3" />}

        <Card className="sync-prompt-card">
          <div className="sync-prompt">
            <i className="pi pi-cloud-download sync-prompt-icon"></i>
            <h2>Initial Sync Required</h2>
            <p>
              To use the API Explorer, we need to download the server's data catalog.
              This includes tracks, vehicles, settings, and more.
            </p>
            <p className="sync-prompt-note">
              This data will be cached locally and also used by the Config Builder.
            </p>
            <Button
              label={syncing ? 'Syncing...' : 'Sync from Server'}
              icon={syncing ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-download'}
              onClick={syncFromServer}
              disabled={syncing}
              className="p-button-lg"
            />
          </div>
        </Card>

        <ServerConnectionDialog
          visible={dialogVisible}
          onHide={() => { setDialogVisible(false); setEditingConnection(null); }}
          onSave={handleDialogSave}
          connection={editingConnection}
        />
      </div>
    );
  }

  // Main explorer view (cache available)
  return (
    <div className="api-explorer-view">
      <Toast ref={toast} />
      <ConfirmDialog />
      {connectionBar}

      <div className="view-header">
        <div className="view-header-actions">
          <div className="sync-status">
            {cacheStatus === 'stale' && (
              <Tag value="Server Updated — Refresh Recommended" severity="warning" icon="pi pi-exclamation-triangle" />
            )}
            {cache?.syncedAt && (
              <span className="sync-time">
                <i className="pi pi-clock"></i>
                Synced: {formatSyncTime(cache.syncedAt)}
              </span>
            )}
          </div>
          <Button
            label={syncing ? 'Syncing...' : 'Sync'}
            icon={syncing ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'}
            onClick={handleSyncClick}
            disabled={syncing}
            className={cacheStatus === 'stale' ? 'p-button-warning' : 'p-button-outlined'}
          />
        </div>
      </div>

      {error && <Message severity="error" text={error} className="status-message mb-3" />}

      <div className="api-explorer-content">
        <Card className="api-explorer-tree-card">
          <div className="tree-filter">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Search endpoints..."
                className="tree-filter-input"
              />
            </span>
            {filterValue && (
              <Button
                icon="pi pi-times"
                className="p-button-text p-button-sm"
                onClick={() => setFilterValue('')}
              />
            )}
          </div>
          <Tree
            value={filteredNodes}
            selectionMode="single"
            selectionKeys={selectedNode?.key ? { [selectedNode.key]: true } : {}}
            onSelectionChange={(e) => {
              let selectedKey: string | undefined;
              if (typeof e.value === 'string') {
                selectedKey = e.value;
              } else if (e.value && typeof e.value === 'object') {
                selectedKey = Object.keys(e.value)[0];
              }

              if (selectedKey) {
                const node = findNodeByKey(filteredNodes, selectedKey);
                if (node) handleNodeSelect(node);
              }
            }}
            expandedKeys={expandedKeys}
            onToggle={(e) => setExpandedKeys(e.value)}
            className="api-tree"
          />
        </Card>

        <Card className="api-explorer-detail-card">
          {selectedListData ? (
            <>
              <div className="detail-header">
                <h3>{selectedNode?.label}</h3>
                <p className="detail-description">{selectedListData.description}</p>
                <div className="detail-meta">
                  <span className="detail-count">{selectedListData.list.length} items</span>
                  <span className="detail-path">
                    <i className="pi pi-link"></i>
                    /api/list/{selectedNode?.data?.path}
                  </span>
                </div>
              </div>
              <DataTable
                value={selectedListData.list}
                paginator
                rows={15}
                rowsPerPageOptions={[10, 15, 25, 50]}
                scrollable
                scrollHeight="flex"
                emptyMessage="No data available"
                className="detail-table"
                sortMode="multiple"
                removableSort
              >
                {getColumnsForData(selectedListData.list).map((col) => (
                  <Column
                    key={col}
                    field={col}
                    header={formatColumnHeader(col)}
                    body={(rowData) => formatCellValue(rowData[col])}
                    sortable
                    filter
                    filterPlaceholder="Search..."
                    style={{ minWidth: col === 'id' || col === 'value' ? '100px' : '150px' }}
                  />
                ))}
              </DataTable>
            </>
          ) : (
            <div className="detail-placeholder">
              <i className="pi pi-info-circle"></i>
              <p>Select an endpoint from the tree to view its data</p>
            </div>
          )}
        </Card>
      </div>

      <ServerConnectionDialog
        visible={dialogVisible}
        onHide={() => { setDialogVisible(false); setEditingConnection(null); }}
        onSave={handleDialogSave}
        connection={editingConnection}
      />
    </div>
  );
};

function findNodeByKey(nodes: TreeNode[], key: string): TreeNode | null {
  for (const node of nodes) {
    if (node.key === key) return node;
    if (node.children) {
      const found = findNodeByKey(node.children, key);
      if (found) return found;
    }
  }
  return null;
}