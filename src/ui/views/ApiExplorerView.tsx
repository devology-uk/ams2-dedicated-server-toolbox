import React, { useState, useEffect } from 'react';
import { Tree } from 'primereact/tree';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import type { TreeNode } from 'primereact/treenode';
import type { TreeExpandedKeysType } from 'primereact/tree';
import type { 
  ServerConnection, 
  ApiListData, 
  ServerCache, 
  AllListsData, 
  ServerVersion 
} from '../types/electron';

interface ApiExplorerViewProps {
  connection: ServerConnection;
  onBack: () => void;
}

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

const ApiExplorerView: React.FC<ApiExplorerViewProps> = ({ connection, onBack }) => {
  // Cache state
  const [cache, setCache] = useState<ServerCache | null>(null);
  const [serverVersion, setServerVersion] = useState<ServerVersion | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'valid' | 'stale' | 'none' | 'error'>('loading');
  
  // UI state
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [selectedListData, setSelectedListData] = useState<ApiListData | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({ 'root': true });

  // Load cache and check version on mount
  useEffect(() => {
    initializeCache();
  }, [connection.id]);

  const initializeCache = async () => {
  setCacheStatus('loading');
  setError(null);

  try {
    // Load existing cache
    const existingCache = await window.electron.cache.get(connection.id);
    
    // Try to get current server version
    const versionResult = await window.electron.api.getVersion(connection.id);
    
    if (versionResult.success && versionResult.data) {
      // Unwrap the version response
      // Unwrap the version response
      const versionData = (versionResult.data as unknown as VersionApiResponse).response;
      setServerVersion(versionData);
      
      if (existingCache) {
        // Compare versions
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
      // Server unreachable - use cache if available
      if (existingCache) {
        setCache(existingCache);
        setCacheStatus('valid');
        setError('Server unreachable. Using cached data.');
      } else {
        setCacheStatus('error');
        setError('Server unreachable and no cached data available.');
      }
    }
  } catch (err) {
    setCacheStatus('error');
    setError('Failed to initialize. Please try again.');
  }
};

 const syncFromServer = async () => {
  setSyncing(true);
  setError(null);

  try {
    // Get version first
    const versionResult = await window.electron.api.getVersion(connection.id);
    
    if (!versionResult.success || !versionResult.data) {
      setError(versionResult.error || 'Failed to get server version');
      setSyncing(false);
      return;
    }

    // Unwrap the version response
    // Unwrap the version response
    const versionData = (versionResult.data as unknown as VersionApiResponse).response;

    // Get all lists
    const listsResult = await window.electron.api.getAllLists(connection.id);
    
    if (!listsResult.success || !listsResult.data) {
      setError(listsResult.error || 'Failed to fetch data from server');
      setSyncing(false);
      return;
    }

    // Save to cache
    const cacheData = {
      version: versionData,
      lists: listsResult.data,
    };
    
    await window.electron.cache.set(connection.id, cacheData);

    // Update local state
    const newCache: ServerCache = {
      version: versionData,
      syncedAt: Date.now(),
      lists: listsResult.data,
    };
    
    setCache(newCache);
    setServerVersion(versionData);
    setCacheStatus('valid');
    
    // Clear selected data to force refresh from new cache
    setSelectedListData(null);
    setSelectedNode(null);
    
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
    
    API_STRUCTURE.forEach(item => {
      const category = item.category || 'Other';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(item);
    });

    const categoryNodes: TreeNode[] = Array.from(categories.entries()).map(([category, items]) => ({
      key: `category-${category}`,
      label: category,
      icon: getCategoryIcon(category),
      data: { type: 'category', category },
      selectable: false,
      children: items.map(item => ({
        key: `list-${item.path}`,
        label: item.label,
        icon: item.icon,
        data: { 
          type: 'list', 
          path: item.path,
          label: item.label,
        },
      })),
    }));

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
      'Attributes': 'pi pi-sliders-h',
      'Core Data': 'pi pi-database',
      'Enums': 'pi pi-list',
      'Flags': 'pi pi-flag',
    };
    return icons[category] || 'pi pi-folder';
  };

 const handleNodeSelect = async (node: TreeNode) => {
  setSelectedNode(node);
  
  if (node.data?.type === 'list') {
    const path = node.data.path as string;
    
    console.log('[Select] Path:', path);
    console.log('[Select] Connection ID:', connection.id);
    
    // Always get fresh cache from store
    const currentCache = await window.electron.cache.get(connection.id);
    
    console.log('[Select] Cache exists:', currentCache !== null);
    console.log('[Select] Cache keys:', currentCache ? Object.keys(currentCache.lists) : 'none');
    console.log('[Select] Path in cache:', currentCache?.lists[path] ? 'YES' : 'NO');
    
    // Try to get from cache first
    if (currentCache?.lists[path]) {
      console.log('[Select] Using cached data, items:', currentCache.lists[path].list?.length);
      setSelectedListData(currentCache.lists[path]);
      return;
    }

    // Fall back to API call if not in cache
    console.log('[Select] Cache miss, calling API...');
    setError(null);
    const result = await window.electron.api.getListByPath(connection.id, path);

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
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });

    const priorityColumns = ['id', 'value', 'name', 'translated_name', 'class', 'gridsize', 'description', 'label'];
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
      const aIndex = priorityColumns.indexOf(a);
      const bIndex = priorityColumns.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedKeys;
  };

  const formatColumnHeader = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
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

  // Render loading state
  if (cacheStatus === 'loading') {
    return (
      <div className="api-explorer-view">
        <div className="view-header">
          <div className="view-header-title">
            <h1>API Explorer</h1>
          </div>
        </div>
        <div className="loading-container">
          <ProgressSpinner />
          <p>Checking server connection...</p>
        </div>
      </div>
    );
  }

  // Render no-cache state (need initial sync)
  if (cacheStatus === 'none' || (cacheStatus === 'error' && !cache)) {
    return (
      <div className="api-explorer-view">
        <div className="view-header">
          <div className="view-header-title">
            <h1>API Explorer</h1>
            <p>Browse all available data from the server API.</p>
          </div>
        </div>
        
        {error && (
          <Message severity="error" text={error} className="status-message" />
        )}

        <Card className="sync-prompt-card">
          <div className="sync-prompt">
            <i className="pi pi-cloud-download sync-prompt-icon"></i>
            <h2>Initial Sync Required</h2>
            <p>
              To use the API Explorer, we need to download the server's data catalog.
              This includes tracks, vehicles, settings, and more.
            </p>
            <p className="sync-prompt-note">
              This data will be cached locally for offline use.
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
      </div>
    );
  }

  return (
    <div className="api-explorer-view">
      <ConfirmDialog />
      
      <div className="view-header">
        <div className="view-header-title">
          <h1>API Explorer</h1>
          <p>Browse all available data from the server API.</p>
        </div>
        <div className="view-header-actions">
          <div className="sync-status">
            {cacheStatus === 'stale' && (
              <Message severity="warn" text="Server updated - refresh recommended" />
            )}
            {cache && (
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

      {error && (
        <Message severity="error" text={error} className="status-message" />
      )}

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
    console.log('[Tree] Selection changed:', e.value);
    
    // Handle both string and object formats
    let selectedKey: string | undefined;
    if (typeof e.value === 'string') {
      selectedKey = e.value;
    } else if (e.value && typeof e.value === 'object') {
      selectedKey = Object.keys(e.value)[0];
    }
    
    console.log('[Tree] Selected key:', selectedKey);
    
    if (selectedKey) {
      const node = findNodeByKey(filteredNodes, selectedKey);
      console.log('[Tree] Found node:', node);
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
                {getColumnsForData(selectedListData.list).map(col => (
                  <Column
                    key={col}
                    field={col}
                    header={formatColumnHeader(col)}
                    body={(rowData) => formatCellValue(rowData[col])}
                    sortable
                    filter
                    filterPlaceholder={`Search...`}
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

export default ApiExplorerView;