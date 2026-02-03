import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { Tooltip } from 'primereact/tooltip';
import type { MenuItem } from 'primereact/menuitem';
import ServerConnectionDialog from './ServerConnectionDialog';
import type { ServerConnection } from '../types/electron';

interface TitlebarProps {
  title?: string;
}

const Titlebar: React.FC<TitlebarProps> = ({ title = 'AMS2 Server Manager' }) => {
  const [isConnectionDialogVisible, setIsConnectionDialogVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ServerConnection | null>(null);
  const [connections, setConnections] = useState<ServerConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<ServerConnection | null>(null);
  const menuRef = useRef<Menu>(null);

  // Load connections on mount
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const conns = await window.electron.getConnections();
    const active = await window.electron.getActiveConnection();
    setConnections(conns);
    setActiveConnection(active);
  };

  const handleAddNew = () => {
    setEditingConnection(null);
    setIsConnectionDialogVisible(true);
  };

  const handleEdit = (connection: ServerConnection) => {
    setEditingConnection(connection);
    setIsConnectionDialogVisible(true);
  };

  const handleSelect = async (connection: ServerConnection) => {
    await window.electron.setActiveConnection(connection.id);
    setActiveConnection(connection);
  };

  const handleDelete = async (connection: ServerConnection) => {
    await window.electron.deleteConnection(connection.id);
    loadConnections();
  };

  const handleDialogSave = async () => {
    setIsConnectionDialogVisible(false);
    setEditingConnection(null);
    loadConnections();
  };

  const buildMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [];

    if (connections.length > 0) {
      // Connection list
      items.push({
        label: 'Servers',
        items: connections.map((conn) => ({
          label: conn.name,
          icon: activeConnection?.id === conn.id ? 'pi pi-check' : 'pi pi-server',
          className: activeConnection?.id === conn.id ? 'active-connection' : '',
          items: [
            {
              label: 'Connect',
              icon: 'pi pi-play',
              command: () => handleSelect(conn),
              disabled: activeConnection?.id === conn.id,
            },
            {
              label: 'Edit',
              icon: 'pi pi-pencil',
              command: () => handleEdit(conn),
            },
            {
              separator: true,
            },
            {
              label: 'Delete',
              icon: 'pi pi-trash',
              className: 'p-error',
              command: () => handleDelete(conn),
            },
          ],
        })),
      });

      items.push({ separator: true });
    }

    // Add new connection option
    items.push({
      label: 'Add Server',
      icon: 'pi pi-plus',
      command: handleAddNew,
    });

    return items;
  };

  return (
    <>
      <div className="titlebar">
        <div className="titlebar-drag-region">
          <div className="titlebar-title">
            <i className="pi pi-car" style={{ marginRight: '8px' }}></i>
            {title}
          </div>
        </div>

        <div className="titlebar-controls">
          {activeConnection && (
            <>
              <Tooltip target=".titlebar-connection-status" position="bottom" />
              <div
                className="titlebar-connection-status"
                data-pr-tooltip={`${activeConnection.name} (${activeConnection.ipAddress}:${activeConnection.port})`}
              >
                <i className="pi pi-server"></i>
                <span>{activeConnection.name}</span>
              </div>
            </>
          )}

          <Button
            icon="pi pi-server"
            className="p-button-text p-button-plain titlebar-button"
            onClick={(e) => menuRef.current?.toggle(e)}
            tooltip="Server Connections"
            tooltipOptions={{ position: 'bottom' }}
          />
          <Menu model={buildMenuItems()} popup ref={menuRef} />
        </div>
      </div>

      <ServerConnectionDialog
        visible={isConnectionDialogVisible}
        onHide={() => {
          setIsConnectionDialogVisible(false);
          setEditingConnection(null);
        }}
        onSave={handleDialogSave}
        connection={editingConnection}
      />
    </>
  );
};

export default Titlebar;