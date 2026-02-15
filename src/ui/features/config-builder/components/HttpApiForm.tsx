// src/ui/features/config-builder/components/HttpApiForm.tsx

import { useState, type ReactNode } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Panel } from 'primereact/panel';
import { Dialog } from 'primereact/dialog';
import { Chips } from 'primereact/chips';
import { Tag } from 'primereact/tag';
import { Accordion, AccordionTab } from 'primereact/accordion';
import type { ServerConfig, HttpApiAccessFilter } from '../../../../shared/types/config';

interface HttpApiFormProps {
  config: ServerConfig;
  onChange: <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => void;
}

const LOG_LEVELS = [
  { label: 'Debug', value: 'debug' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
];

const ACCESS_LEVEL_OPTIONS = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Admin', value: 'admin' },
];

const FILTER_TYPE_OPTIONS: Array<{ label: string; value: HttpApiAccessFilter['type'] }> = [
  { label: 'Accept', value: 'accept' },
  { label: 'Reject', value: 'reject' },
  { label: 'Reject (password required)', value: 'reject-password' },
  { label: 'Accept from IP', value: 'ip-accept' },
  { label: 'Reject from IP', value: 'ip-reject' },
  { label: 'Accept user', value: 'user' },
  { label: 'Accept group', value: 'group' },
];

interface AccessLevelRow {
  pattern: string;
  level: string;
}

interface EditingFilter {
  levelName: string;
  ruleIndex: number | null; // null = adding new
  rule: HttpApiAccessFilter;
}

export const HttpApiForm = ({
  config,
  onChange,
}: HttpApiFormProps) => {
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<{ username: string; password: string } | null>(null);
  const [editingGroup, setEditingGroup] = useState<{ name: string; members: string[] } | null>(null);

  // Access levels state
  const [showLevelDialog, setShowLevelDialog] = useState(false);
  const [editingLevel, setEditingLevel] = useState<{ pattern: string; level: string; originalPattern?: string } | null>(null);

  // Access filters state
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [editingFilter, setEditingFilter] = useState<EditingFilter | null>(null);
  const [showAddLevelNameDialog, setShowAddLevelNameDialog] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');

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

  // Convert access levels to array for DataTable
  const accessLevelsArray: AccessLevelRow[] = Object.entries(config.httpApiAccessLevels ?? {}).map(
    ([pattern, level]) => ({ pattern, level })
  );

  // Get filter levels (always include public/private/admin, plus any custom)
  const filterLevels = (() => {
    const filters = config.httpApiAccessFilters ?? {};
    const levels = new Set(['public', 'private', 'admin', ...Object.keys(filters)]);
    return Array.from(levels);
  })();

  // ========================
  // User CRUD
  // ========================
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
    const newUsers = { ...config.httpApiUsers, [editingUser.username]: editingUser.password };
    onChange('httpApiUsers', newUsers);
    setShowUserDialog(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (username: string) => {
    const newUsers = { ...config.httpApiUsers };
    delete newUsers[username];
    onChange('httpApiUsers', newUsers);
  };

  // ========================
  // Group CRUD
  // ========================
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
    const newGroups = { ...config.httpApiGroups, [editingGroup.name]: editingGroup.members };
    onChange('httpApiGroups', newGroups);
    setShowGroupDialog(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (name: string) => {
    const newGroups = { ...config.httpApiGroups };
    delete newGroups[name];
    onChange('httpApiGroups', newGroups);
  };

  // ========================
  // Access Levels CRUD
  // ========================
  const handleAddLevel = () => {
    setEditingLevel({ pattern: '', level: 'public' });
    setShowLevelDialog(true);
  };

  const handleEditLevel = (row: AccessLevelRow) => {
    setEditingLevel({ pattern: row.pattern, level: row.level, originalPattern: row.pattern });
    setShowLevelDialog(true);
  };

  const handleSaveLevel = () => {
    if (!editingLevel || editingLevel.pattern === '') return;
    const newLevels = { ...config.httpApiAccessLevels };
    // Remove old key if pattern was changed
    if (editingLevel.originalPattern && editingLevel.originalPattern !== editingLevel.pattern) {
      delete newLevels[editingLevel.originalPattern];
    }
    newLevels[editingLevel.pattern] = editingLevel.level;
    onChange('httpApiAccessLevels', newLevels);
    setShowLevelDialog(false);
    setEditingLevel(null);
  };

  const handleDeleteLevel = (pattern: string) => {
    const newLevels = { ...config.httpApiAccessLevels };
    delete newLevels[pattern];
    onChange('httpApiAccessLevels', newLevels);
  };

  // ========================
  // Access Filters CRUD
  // ========================
  const handleAddFilterRule = (levelName: string) => {
    setEditingFilter({
      levelName,
      ruleIndex: null,
      rule: { type: 'accept' },
    });
    setShowFilterDialog(true);
  };

  const handleEditFilterRule = (levelName: string, ruleIndex: number, rule: HttpApiAccessFilter) => {
    setEditingFilter({
      levelName,
      ruleIndex,
      rule: { ...rule },
    });
    setShowFilterDialog(true);
  };

  const handleSaveFilterRule = () => {
    if (!editingFilter) return;
    const filters = { ...config.httpApiAccessFilters };
    const rules = [...(filters[editingFilter.levelName] ?? [])];

    if (editingFilter.ruleIndex === null) {
      rules.push(editingFilter.rule);
    } else {
      rules[editingFilter.ruleIndex] = editingFilter.rule;
    }

    filters[editingFilter.levelName] = rules;
    onChange('httpApiAccessFilters', filters);
    setShowFilterDialog(false);
    setEditingFilter(null);
  };

  const handleDeleteFilterRule = (levelName: string, ruleIndex: number) => {
    const filters = { ...config.httpApiAccessFilters };
    const rules = [...(filters[levelName] ?? [])];
    rules.splice(ruleIndex, 1);
    filters[levelName] = rules;
    onChange('httpApiAccessFilters', filters);
  };

  const handleMoveFilterRule = (levelName: string, ruleIndex: number, direction: -1 | 1) => {
    const filters = { ...config.httpApiAccessFilters };
    const rules = [...(filters[levelName] ?? [])];
    const newIndex = ruleIndex + direction;
    if (newIndex < 0 || newIndex >= rules.length) return;
    [rules[ruleIndex], rules[newIndex]] = [rules[newIndex], rules[ruleIndex]];
    filters[levelName] = rules;
    onChange('httpApiAccessFilters', filters);
  };

  const handleAddFilterLevel = () => {
    if (!newLevelName.trim()) return;
    const filters = { ...config.httpApiAccessFilters, [newLevelName.trim()]: [] };
    onChange('httpApiAccessFilters', filters);
    setShowAddLevelNameDialog(false);
    setNewLevelName('');
  };

  const handleDeleteFilterLevel = (levelName: string) => {
    const filters = { ...config.httpApiAccessFilters };
    delete filters[levelName];
    onChange('httpApiAccessFilters', filters);
  };

  // ========================
  // Templates
  // ========================
  const userActionsTemplate = (rowData: { username: string; password: string }): ReactNode => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" severity="secondary" size="small" rounded text
        onClick={() => handleEditUser(rowData)} />
      <Button icon="pi pi-trash" severity="danger" size="small" rounded text
        onClick={() => handleDeleteUser(rowData.username)} />
    </div>
  );

  const groupActionsTemplate = (rowData: { name: string; members: string[] }): ReactNode => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" severity="secondary" size="small" rounded text
        onClick={() => handleEditGroup(rowData)} />
      <Button icon="pi pi-trash" severity="danger" size="small" rounded text
        onClick={() => handleDeleteGroup(rowData.name)} />
    </div>
  );

  const membersTemplate = (rowData: { members: string[] }): ReactNode => (
    <span>{rowData.members.join(', ')}</span>
  );

  const levelActionsTemplate = (rowData: AccessLevelRow): ReactNode => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" severity="secondary" size="small" rounded text
        onClick={() => handleEditLevel(rowData)} />
      <Button icon="pi pi-trash" severity="danger" size="small" rounded text
        onClick={() => handleDeleteLevel(rowData.pattern)} />
    </div>
  );

  const levelTagTemplate = (rowData: AccessLevelRow): ReactNode => {
    const severityMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      public: 'success', private: 'warning', admin: 'danger',
    };
    return <Tag value={rowData.level} severity={severityMap[rowData.level] ?? 'info'} />;
  };

  const filterTypeNeedsField = (type: HttpApiAccessFilter['type']): 'ip' | 'group' | 'user' | null => {
    if (type === 'ip-accept' || type === 'ip-reject') return 'ip';
    if (type === 'group') return 'group';
    if (type === 'user') return 'user';
    return null;
  };

  const filterRuleSummary = (rule: HttpApiAccessFilter): string => {
    const typeLabel = FILTER_TYPE_OPTIONS.find(o => o.value === rule.type)?.label ?? rule.type;
    if (rule.ip) return `${typeLabel} — ${rule.ip}`;
    if (rule.group) return `${typeLabel} — ${rule.group}`;
    if (rule.user) return `${typeLabel} — ${rule.user}`;
    return typeLabel;
  };

  const filterRuleTypeSeverity = (type: HttpApiAccessFilter['type']): 'success' | 'danger' | 'warning' | 'info' => {
    if (type === 'accept' || type === 'ip-accept' || type === 'group' || type === 'user') return 'success';
    if (type === 'reject' || type === 'ip-reject') return 'danger';
    if (type === 'reject-password') return 'warning';
    return 'info';
  };

  return (
    <div className="http-api-form">
      {/* Connection Settings */}
      <Panel header="Connection Settings" toggleable className="mb-3">
        <div className="grid">
          <div className="col-12 md:col-4">
            <div className="field flex align-items-center gap-3">
              <InputSwitch
                id="enableHttpApi"
                checked={config.enableHttpApi ?? false}
                onChange={(e) => onChange('enableHttpApi', e.value)}
              />
              <label htmlFor="enableHttpApi">Enable HTTP API</label>
            </div>
          </div>

          {config.enableHttpApi && (
            <>
              <div className="col-12 md:col-4">
                <div className="field">
                  <label htmlFor="httpApiInterface" className="block font-medium mb-2">
                    API Interface
                  </label>
                  <InputText
                    id="httpApiInterface"
                    value={config.httpApiInterface ?? ''}
                    onChange={(e) => onChange('httpApiInterface', e.target.value)}
                    className="w-full"
                    placeholder="0.0.0.0"
                  />
                </div>
              </div>

              <div className="col-12 md:col-4">
                <div className="field">
                  <label htmlFor="httpApiPort" className="block font-medium mb-2">
                    API Port
                  </label>
                  <InputNumber
                    id="httpApiPort"
                    value={config.httpApiPort ?? 9000}
                    onValueChange={(e) => onChange('httpApiPort', e.value ?? 9000)}
                    min={1024}
                    max={65535}
                    useGrouping={false}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-4">
                <div className="field">
                  <label htmlFor="httpApiLogLevel" className="block font-medium mb-2">
                    API Log Level
                  </label>
                  <Dropdown
                    id="httpApiLogLevel"
                    value={config.httpApiLogLevel ?? 'warning'}
                    options={LOG_LEVELS}
                    onChange={(e) => onChange('httpApiLogLevel', e.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="field">
                  <label htmlFor="staticWebFiles" className="block font-medium mb-2">
                    Static Web Files Path
                  </label>
                  <InputText
                    id="staticWebFiles"
                    value={config.staticWebFiles ?? ''}
                    onChange={(e) => onChange('staticWebFiles', e.target.value)}
                    className="w-full"
                    placeholder="web_files"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* Users Panel */}
      <Panel
        header={
          <div className="flex align-items-center justify-content-between flex-1">
            <span>Users</span>
            <Button icon="pi pi-plus" label="Add" size="small" onClick={handleAddUser} />
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
          <div className="flex align-items-center justify-content-between flex-1">
            <span>Groups</span>
            <Button icon="pi pi-plus" label="Add" size="small" onClick={handleAddGroup} />
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
      <Panel
        header={
          <div className="flex align-items-center justify-content-between flex-1">
            <span>Access Levels</span>
            <Button icon="pi pi-plus" label="Add" size="small" onClick={handleAddLevel} />
          </div>
        }
        toggleable
        className="mb-3"
      >
        <p className="text-color-secondary mb-3">
          Override the default access level for API endpoints matching a wildcard pattern.
          Patterns support <code>*</code> (any chars), <code>%</code> (any except /), and <code>?</code> (single char).
        </p>
        <DataTable value={accessLevelsArray} emptyMessage="No overrides configured (using endpoint defaults)">
          <Column field="pattern" header="Endpoint Pattern"
            body={(row: AccessLevelRow) => <code>{row.pattern || '(root)'}</code>} />
          <Column field="level" header="Access Level" body={levelTagTemplate} style={{ width: '10rem' }} />
          <Column body={levelActionsTemplate} style={{ width: '100px' }} />
        </DataTable>
      </Panel>

      {/* Access Filters Panel */}
      <Panel
        header={
          <div className="flex align-items-center justify-content-between flex-1">
            <span>Access Filters</span>
            <Button icon="pi pi-plus" label="Add" size="small"
              onClick={() => { setNewLevelName(''); setShowAddLevelNameDialog(true); }} />
          </div>
        }
        toggleable
        className="mb-3"
      >
        <p className="text-color-secondary mb-3">
          Define filter rules for each access level. Rules are evaluated in order — the first match decides access.
        </p>
        <Accordion multiple>
          {filterLevels.map((levelName) => {
            const rules = (config.httpApiAccessFilters ?? {})[levelName] ?? [];
            const isBuiltIn = ['public', 'private', 'admin'].includes(levelName);
            const severityMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
              public: 'success', private: 'warning', admin: 'danger',
            };

            return (
              <AccordionTab
                key={levelName}
                header={
                  <div className="flex align-items-center gap-2">
                    <Tag value={levelName} severity={severityMap[levelName] ?? 'info'} />
                    <span className="text-color-secondary text-sm">({rules.length} rules)</span>
                  </div>
                }
              >
                <div className="flex flex-column gap-2">
                  {rules.map((rule, idx) => (
                    <div key={idx}
                      className="flex align-items-center justify-content-between p-2 border-1 surface-border border-round">
                      <div className="flex align-items-center gap-2">
                        <span className="font-mono text-sm text-color-secondary">{idx + 1}.</span>
                        <Tag value={rule.type} severity={filterRuleTypeSeverity(rule.type)} />
                        <span className="text-sm">{filterRuleSummary(rule).replace(`${FILTER_TYPE_OPTIONS.find(o => o.value === rule.type)?.label ?? rule.type} — `, '')
                          !== filterRuleSummary(rule) ? filterRuleSummary(rule).split(' — ')[1] : ''}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button icon="pi pi-arrow-up" size="small" rounded text severity="secondary"
                          disabled={idx === 0}
                          onClick={() => handleMoveFilterRule(levelName, idx, -1)}
                          tooltip="Move up" tooltipOptions={{ position: 'top' }} />
                        <Button icon="pi pi-arrow-down" size="small" rounded text severity="secondary"
                          disabled={idx === rules.length - 1}
                          onClick={() => handleMoveFilterRule(levelName, idx, 1)}
                          tooltip="Move down" tooltipOptions={{ position: 'top' }} />
                        <Button icon="pi pi-pencil" size="small" rounded text severity="secondary"
                          onClick={() => handleEditFilterRule(levelName, idx, rule)} />
                        <Button icon="pi pi-trash" size="small" rounded text severity="danger"
                          onClick={() => handleDeleteFilterRule(levelName, idx)} />
                      </div>
                    </div>
                  ))}

                  {rules.length === 0 && (
                    <div className="text-color-secondary text-center p-3">
                      No rules configured — all requests to this level will be rejected.
                    </div>
                  )}

                  <div className="flex justify-content-between mt-2">
                    <Button icon="pi pi-plus" label="Add Rule" size="small" outlined
                      onClick={() => handleAddFilterRule(levelName)} />
                    {!isBuiltIn && (
                      <Button icon="pi pi-trash" label="Remove Level" size="small" severity="danger" outlined
                        onClick={() => handleDeleteFilterLevel(levelName)} />
                    )}
                  </div>
                </div>
              </AccordionTab>
            );
          })}
        </Accordion>
      </Panel>

      {/* ======================== */}
      {/* Dialogs                  */}
      {/* ======================== */}

      {/* User Dialog */}
      <Dialog
        header={editingUser?.username ? 'Edit User' : 'Add User'}
        visible={showUserDialog}
        onHide={() => setShowUserDialog(false)}
        style={{ width: '400px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancel" severity="secondary" onClick={() => setShowUserDialog(false)} />
            <Button label="Save" onClick={handleSaveUser} />
          </div>
        }
      >
        <div className="field mb-3">
          <label htmlFor="edit-username" className="block font-medium mb-2">Username</label>
          <InputText id="edit-username" value={editingUser?.username ?? ''} className="w-full"
            onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, username: e.target.value } : null))} />
        </div>
        <div className="field">
          <label htmlFor="edit-password" className="block font-medium mb-2">Password</label>
          <InputText id="edit-password" value={editingUser?.password ?? ''} className="w-full" type="password"
            onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, password: e.target.value } : null))} />
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
            <Button label="Cancel" severity="secondary" onClick={() => setShowGroupDialog(false)} />
            <Button label="Save" onClick={handleSaveGroup} />
          </div>
        }
      >
        <div className="field mb-3">
          <label htmlFor="edit-groupname" className="block font-medium mb-2">Group Name</label>
          <InputText id="edit-groupname" value={editingGroup?.name ?? ''} className="w-full"
            onChange={(e) => setEditingGroup((prev) => (prev ? { ...prev, name: e.target.value } : null))} />
        </div>
        <div className="field">
          <label htmlFor="edit-members" className="block font-medium mb-2">Members (press Enter to add)</label>
          <Chips id="edit-members" value={editingGroup?.members ?? []} className="w-full"
            placeholder="Type username and press Enter"
            onChange={(e) => setEditingGroup((prev) => (prev ? { ...prev, members: e.value ?? [] } : null))} />
        </div>
      </Dialog>

      {/* Access Level Override Dialog */}
      <Dialog
        header={editingLevel?.originalPattern !== undefined ? 'Edit Access Level Override' : 'Add Access Level Override'}
        visible={showLevelDialog}
        onHide={() => setShowLevelDialog(false)}
        style={{ width: '450px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancel" severity="secondary" onClick={() => setShowLevelDialog(false)} />
            <Button label="Save" onClick={handleSaveLevel} />
          </div>
        }
      >
        <div className="field mb-3">
          <label htmlFor="edit-pattern" className="block font-medium mb-2">Endpoint Pattern</label>
          <InputText id="edit-pattern" value={editingLevel?.pattern ?? ''} className="w-full"
            placeholder="api/list*"
            onChange={(e) => setEditingLevel((prev) => (prev ? { ...prev, pattern: e.target.value } : null))} />
          <small className="text-color-secondary">
            Wildcards: <code>*</code> = any chars, <code>%</code> = any except /, <code>?</code> = single char
          </small>
        </div>
        <div className="field">
          <label htmlFor="edit-access-level" className="block font-medium mb-2">Access Level</label>
          <Dropdown id="edit-access-level" value={editingLevel?.level ?? 'public'}
            options={ACCESS_LEVEL_OPTIONS} className="w-full"
            onChange={(e) => setEditingLevel((prev) => (prev ? { ...prev, level: e.value } : null))} />
        </div>
      </Dialog>

      {/* Filter Rule Dialog */}
      <Dialog
        header={editingFilter?.ruleIndex !== null ? 'Edit Filter Rule' : 'Add Filter Rule'}
        visible={showFilterDialog}
        onHide={() => setShowFilterDialog(false)}
        style={{ width: '450px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancel" severity="secondary" onClick={() => setShowFilterDialog(false)} />
            <Button label="Save" onClick={handleSaveFilterRule} />
          </div>
        }
      >
        <div className="field mb-3">
          <label htmlFor="edit-filter-type" className="block font-medium mb-2">Rule Type</label>
          <Dropdown id="edit-filter-type" value={editingFilter?.rule.type ?? 'accept'}
            options={FILTER_TYPE_OPTIONS} className="w-full"
            onChange={(e) => setEditingFilter((prev) => {
              if (!prev) return null;
              const newRule: HttpApiAccessFilter = { type: e.value };
              // Preserve field value if type still needs same field
              const needsField = filterTypeNeedsField(e.value);
              if (needsField === 'ip' && prev.rule.ip) newRule.ip = prev.rule.ip;
              if (needsField === 'user' && prev.rule.user) newRule.user = prev.rule.user;
              if (needsField === 'group' && prev.rule.group) newRule.group = prev.rule.group;
              return { ...prev, rule: newRule };
            })} />
        </div>

        {editingFilter && filterTypeNeedsField(editingFilter.rule.type) === 'ip' && (
          <div className="field mb-3">
            <label htmlFor="edit-filter-ip" className="block font-medium mb-2">IP Address (CIDR)</label>
            <InputText id="edit-filter-ip" value={editingFilter.rule.ip ?? ''} className="w-full"
              placeholder="127.0.0.1/32"
              onChange={(e) => setEditingFilter((prev) =>
                prev ? { ...prev, rule: { ...prev.rule, ip: e.target.value } } : null)} />
          </div>
        )}

        {editingFilter && filterTypeNeedsField(editingFilter.rule.type) === 'group' && (
          <div className="field mb-3">
            <label htmlFor="edit-filter-group" className="block font-medium mb-2">Group Name</label>
            <Dropdown id="edit-filter-group" value={editingFilter.rule.group ?? ''}
              options={Object.keys(config.httpApiGroups ?? {}).map(g => ({ label: g, value: g }))}
              className="w-full" editable placeholder="Select or type group name"
              onChange={(e) => setEditingFilter((prev) =>
                prev ? { ...prev, rule: { ...prev.rule, group: e.value } } : null)} />
          </div>
        )}

        {editingFilter && filterTypeNeedsField(editingFilter.rule.type) === 'user' && (
          <div className="field mb-3">
            <label htmlFor="edit-filter-user" className="block font-medium mb-2">Username</label>
            <Dropdown id="edit-filter-user"
              value={editingFilter.rule.user ?? ''}
              options={Object.keys(config.httpApiUsers ?? {}).map(u => ({ label: u, value: u }))}
              className="w-full" editable placeholder="Select or type username"
              onChange={(e) => setEditingFilter((prev) =>
                prev ? { ...prev, rule: { ...prev.rule, user: e.value } } : null)} />
          </div>
        )}
      </Dialog>

      {/* Add Custom Filter Level Dialog */}
      <Dialog
        header="Add Custom Access Level"
        visible={showAddLevelNameDialog}
        onHide={() => setShowAddLevelNameDialog(false)}
        style={{ width: '350px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancel" severity="secondary" onClick={() => setShowAddLevelNameDialog(false)} />
            <Button label="Add" onClick={handleAddFilterLevel} disabled={!newLevelName.trim()} />
          </div>
        }
      >
        <div className="field">
          <label htmlFor="new-level-name" className="block font-medium mb-2">Level Name</label>
          <InputText id="new-level-name" value={newLevelName} className="w-full"
            placeholder="e.g. moderator"
            onChange={(e) => setNewLevelName(e.target.value)} />
        </div>
      </Dialog>
    </div>
  );
};
