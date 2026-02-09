import { useState, useEffect, useRef, use } from 'react';

import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { Tooltip } from 'primereact/tooltip';

import './Titlebar.scss';
import type { MenuItem } from 'primereact/menuitem';
import type { ServerConnection } from '../../shared/types/index.js';
import {ServerConnectionDialog} from './ServerConnectionDialog';
import type { ActiveFeature } from '../types/ActiveFeature.js';

interface TitlebarProps {
  title?: string;
  activeFeature: ActiveFeature;
  onBack?: () => void;
}

export const Titlebar = ({ 
  title = 'AMS2 Dedicated Server Toolbox',
  activeFeature,
  onBack
} : TitlebarProps) => {
  const [isConnectionDialogVisible, setIsConnectionDialogVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ServerConnection | null>(null);
  const [connections, setConnections] = useState<ServerConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<ServerConnection | null>(null);
  const [showBackButton, setShowBackButton] = useState(false);
  const menuRef = useRef<Menu>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    setShowBackButton(activeFeature !== 'home');
  }, [activeFeature]);

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

    if (connections.length > 0 && activeConnection) {
      items.push({
        label: 'Current Server',
        items: [
          {
            label: 'Edit',
            icon: 'pi pi-pencil',
            command: () => handleEdit(activeConnection),
          },
          {
            label: 'Delete',
            icon: 'pi pi-trash',
            className: 'p-error',
            command: () => handleDelete(activeConnection),
          },
        ],
      });

      items.push({ separator: true });
    }

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
          {showBackButton && (
            <Button
              icon="pi pi-arrow-left"
              className="p-button-text p-button-plain titlebar-back-button"
              onClick={onBack}
              tooltip="Back"
              tooltipOptions={{ position: 'bottom' }}
            />
          )}
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
            icon="pi pi-cog"
            className="p-button-text p-button-plain titlebar-button"
            onClick={(e) => menuRef.current?.toggle(e)}
            tooltip="Settings"
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