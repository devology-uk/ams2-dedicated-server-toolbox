// src/ui/features/config-builder/components/AccessControlForm.tsx

import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Panel } from 'primereact/panel';
import { Dialog } from 'primereact/dialog';
import { Chips } from 'primereact/chips';
import type { ServerConfig } from '../../../../shared/types/config';

interface AccessControlFormProps {
  config: ServerConfig;
  onChange: <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => void;
}

export const AccessControlForm = ({
  config,
  onChange,
}: AccessControlFormProps) => {
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<{ username: string; password: string } | null>(null);
  const [editingGroup, setEditingGroup] = useState<{ name: string; members: string[] } | null>(null);

  // Convert users object to array for DataTable
  const usersArray = Object.entries(config.httpApiUsers ?? {}).map(([username, password]) => ({
    username,
    password,
  }));

  // Convert groups object to array for DataTable
  const groupsArray = Object.entries(config.httpApiGroups ?? {}).map(([name, members]) => ({
    name,
    members,
  }));

  // User CRUD operations
  const handleAddUser = () => {
    setEditingUser({ username: '', password: '' });
    setShowUserDialog(true);
  };

  const handleEditUser = (user: { username: string; password: string }) => {
    setEditingUser({ ...user });
    setShowUserDialog(true);
  };

  const handleSaveUser = () => {
    if (!editingUser || !editingUser.username) return;

    const newUsers = {
      ...config.httpApiUsers,
      [editingUser.username]: editingUser.password,
    };
    onChange('httpApiUsers', newUsers);
    setShowUserDialog(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (username: string) => {
    const newUsers = { ...config.httpApiUsers };
    delete newUsers[username];
    onChange('httpApiUsers', newUsers);
  };

  // Group CRUD operations
  const handleAddGroup = () => {
    setEditingGroup({ name: '', members: [] });
    setShowGroupDialog(true);
  };

  const handleEditGroup = (group: { name: string; members: string[] }) => {
    setEditingGroup({ ...group, members: [...group.members] });
    setShowGroupDialog(true);
  };

  const handleSaveGroup = () => {
    if (!editingGroup || !editingGroup.name) return;

    const newGroups = {
      ...config.httpApiGroups,
      [editingGroup.name]: editingGroup.members,
    };
    onChange('httpApiGroups', newGroups);
    setShowGroupDialog(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (name: string) => {
    const newGroups = { ...config.httpApiGroups };
    delete newGroups[name];
    onChange('httpApiGroups', newGroups);
  };

  // Action buttons template for users table
  const userActionsTemplate = (rowData: { username: string; password: string }) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          severity="secondary"
          size="small"
          rounded
          text
          onClick={() => handleEditUser(rowData)}
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          size="small"
          rounded
          text
          onClick={() => handleDeleteUser(rowData.username)}
        />
      </div>
    );
  };

  // Action buttons template for groups table
  const groupActionsTemplate = (rowData: { name: string; members: string[] }) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          severity="secondary"
          size="small"
          rounded
          text
          onClick={() => handleEditGroup(rowData)}
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          size="small"
          rounded
          text
          onClick={() => handleDeleteGroup(rowData.name)}
        />
      </div>
    );
  };

  // Members template for groups table
  const membersTemplate = (rowData: { members: string[] }) => {
    return <span>{rowData.members.join(', ')}</span>;
  };

  return (
    <div className="access-control-form">
      {/* Users Panel */}
      <Panel
        header={
          <div className="flex align-items-center justify-content-between w-full">
            <span>HTTP API Users</span>
            <Button
              icon="pi pi-plus"
              label="Add User"
              size="small"
              onClick={handleAddUser}
            />
          </div>
        }
        toggleable
        className="mb-3"
      >
        <DataTable value={usersArray} emptyMessage="No users configured">
          <Column field="username" header="Username" />
          <Column field="password" header="Password" body={() => '••••••••'} />
          <Column body={userActionsTemplate} style={{ width: '100px' }} />
        </DataTable>
      </Panel>

      {/* Groups Panel */}
      <Panel
        header={
          <div className="flex align-items-center justify-content-between w-full">
            <span>HTTP API Groups</span>
            <Button
              icon="pi pi-plus"
              label="Add Group"
              size="small"
              onClick={handleAddGroup}
            />
          </div>
        }
        toggleable
        className="mb-3"
      >
        <DataTable value={groupsArray} emptyMessage="No groups configured">
          <Column field="name" header="Group Name" />
          <Column header="Members" body={membersTemplate} />
          <Column body={groupActionsTemplate} style={{ width: '100px' }} />
        </DataTable>
      </Panel>

      {/* Access Levels Panel */}
      <Panel header="Access Levels" toggleable className="mb-3">
        <p className="text-color-secondary mb-3">
          Define which access level applies to each API endpoint pattern.
        </p>
        <div className="text-color-secondary text-center p-3">
          <i className="pi pi-wrench text-2xl mb-2 block"></i>
          <p>Access levels editor coming soon...</p>
        </div>
      </Panel>

      {/* Access Filters Panel */}
      <Panel header="Access Filters" toggleable className="mb-3">
        <p className="text-color-secondary mb-3">
          Define filter rules for each access level (public, private, admin).
        </p>
        <div className="text-color-secondary text-center p-3">
          <i className="pi pi-wrench text-2xl mb-2 block"></i>
          <p>Access filters editor coming soon...</p>
        </div>
      </Panel>

      {/* User Dialog */}
      <Dialog
        header={editingUser?.username ? 'Edit User' : 'Add User'}
        visible={showUserDialog}
        onHide={() => setShowUserDialog(false)}
        style={{ width: '400px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowUserDialog(false)}
            />
            <Button label="Save" onClick={handleSaveUser} />
          </div>
        }
      >
        <div className="field mb-3">
          <label htmlFor="edit-username" className="block font-medium mb-2">
            Username
          </label>
          <InputText
            id="edit-username"
            value={editingUser?.username ?? ''}
            onChange={(e) =>
              setEditingUser((prev) => (prev ? { ...prev, username: e.target.value } : null))
            }
            className="w-full"
          />
        </div>
        <div className="field">
          <label htmlFor="edit-password" className="block font-medium mb-2">
            Password
          </label>
          <InputText
            id="edit-password"
            value={editingUser?.password ?? ''}
            onChange={(e) =>
              setEditingUser((prev) => (prev ? { ...prev, password: e.target.value } : null))
            }
            className="w-full"
            type="password"
          />
        </div>
      </Dialog>

      {/* Group Dialog */}
      <Dialog
        header={editingGroup?.name ? 'Edit Group' : 'Add Group'}
        visible={showGroupDialog}
        onHide={() => setShowGroupDialog(false)}
        style={{ width: '500px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowGroupDialog(false)}
            />
            <Button label="Save" onClick={handleSaveGroup} />
          </div>
        }
      >
        <div className="field mb-3">
          <label htmlFor="edit-groupname" className="block font-medium mb-2">
            Group Name
          </label>
          <InputText
            id="edit-groupname"
            value={editingGroup?.name ?? ''}
            onChange={(e) =>
              setEditingGroup((prev) => (prev ? { ...prev, name: e.target.value } : null))
            }
            className="w-full"
          />
        </div>
        <div className="field">
          <label htmlFor="edit-members" className="block font-medium mb-2">
            Members (press Enter to add)
          </label>
          <Chips
            id="edit-members"
            value={editingGroup?.members ?? []}
            onChange={(e) =>
              setEditingGroup((prev) => (prev ? { ...prev, members: e.value ?? [] } : null))
            }
            className="w-full"
            placeholder="Type username and press Enter"
          />
        </div>
      </Dialog>
    </div>
  );
};