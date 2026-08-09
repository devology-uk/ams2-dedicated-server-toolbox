// src/ui/features/sms-rotate/components/SmsRotateForm.tsx

import { useMemo, useRef } from 'react';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { DynamicForm } from '../../config-builder/components/DynamicForm';
import { useFieldSchema } from '../../config-builder/hooks';
import { RotationEntryPanel } from './RotationEntryPanel';
import { useSmsRotateConfigState } from '../hooks/useSmsRotateConfigState';
import type { ResolvedField } from '../../../../shared/types/config';

// Attributes that are always valid rotation-entry overrides, regardless of
// whether the default setup has a value for them (see lib_rotate.lua's
// extra_external_attributes). RemoveFlags is synthetic — it isn't part of
// the real AMS2 attribute schema, so it's added manually below.
const ALWAYS_OVERRIDABLE = new Set(['TrackId', 'VehicleModelId', 'VehicleClassId']);

export const SmsRotateForm = () => {
  const toast = useRef<Toast>(null);
  const { fieldGroups, resolvedFields, isLoading, error } = useFieldSchema();

  const {
    config,
    isDirty,
    setPersistIndex,
    updateDefaultAttribute,
    addRotationEntry,
    removeRotationEntry,
    moveRotationEntry,
    setRotationAttribute,
    removeRotationAttribute,
    importFromString,
    exportToString,
    markAsSaved,
  } = useSmsRotateConfigState();

  // ServerControls* attributes are derived by the plugin from TrackId/VehicleModelId/
  // VehicleClassId — the plugin forbids setting them directly, in both the default
  // setup and every rotation entry.
  const defaultSetupGroups = useMemo(
    () => fieldGroups.filter(g => g.id !== 'server-control'),
    [fieldGroups],
  );

  const removeFlagsField = useMemo((): ResolvedField | null => {
    const flagsField = resolvedFields.find(f => f.name === 'Flags');
    if (!flagsField) return null;
    return {
      ...flagsField,
      name: 'RemoveFlags',
      label: 'Remove Flags',
      description: 'Flags to remove from the default setup for this entry only.',
    };
  }, [resolvedFields]);

  const overridableFields = useMemo(() => {
    const defaultKeys = new Set(Object.keys(config.default));
    const fields = resolvedFields.filter(
      f => !f.name.startsWith('ServerControls') && (defaultKeys.has(f.name) || ALWAYS_OVERRIDABLE.has(f.name)),
    );
    return removeFlagsField ? [...fields, removeFlagsField] : fields;
  }, [resolvedFields, config.default, removeFlagsField]);

  const handleAttributeChange = (name: string, value: unknown) => {
    updateDefaultAttribute(name, value as number);
  };

  const doImport = async () => {
    try {
      const result = await window.electron.importSmsRotateConfig();
      if (result.cancelled) return;

      if (!result.success || !result.data) {
        toast.current?.show({
          severity: 'error',
          summary: 'Import Failed',
          detail: result.error ?? 'Could not read file',
          life: 5000,
        });
        return;
      }

      const parseResult = importFromString(result.data);
      if (parseResult.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Import Successful',
          detail: `Loaded ${result.filename ?? 'sms_rotate_config.json'}`,
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Parse Error',
          detail: parseResult.error,
          life: 5000,
        });
      }
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Import Failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
        life: 5000,
      });
    }
  };

  const handleImport = () => {
    if (isDirty) {
      confirmDialog({
        message: 'You have unsaved changes. Import will overwrite them. Continue?',
        header: 'Confirm Import',
        icon: 'pi pi-exclamation-triangle',
        accept: doImport,
      });
    } else {
      doImport();
    }
  };

  const handleExport = async () => {
    try {
      const result = await window.electron.exportSmsRotateConfig(exportToString());
      if (result.cancelled) return;

      if (result.success) {
        markAsSaved();
        toast.current?.show({
          severity: 'success',
          summary: 'Export Successful',
          detail: `Saved to ${result.filename ?? 'sms_rotate_config.json'}`,
          life: 3000,
        });
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Export Failed',
          detail: result.error ?? 'Could not save file',
          life: 5000,
        });
      }
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Export Failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
        life: 5000,
      });
    }
  };

  if (isLoading) {
    return <p className="text-color-secondary">Loading configuration schema...</p>;
  }

  if (error || fieldGroups.length === 0) {
    return (
      <p className="text-color-secondary">
        {error ?? 'No game data available. Sync data from a running server using the API Explorer.'}
      </p>
    );
  }

  return (
    <div className="sms-rotate-form">
      <Toast ref={toast} />

      <div className="flex align-items-center justify-content-end gap-2 mb-3">
        {isDirty && <span className="text-orange-500 font-medium mr-auto">(unsaved changes)</span>}
        <Button label="Import" icon="pi pi-upload" severity="secondary" outlined onClick={handleImport} />
        <Button label="Export" icon="pi pi-download" severity="success" onClick={handleExport} />
      </div>

      <Panel header="Rotation Settings" toggleable className="mb-3">
        <div className="field flex align-items-center gap-3 m-0">
          <InputSwitch
            id="persistIndex"
            checked={config.persistIndex}
            onChange={(e) => setPersistIndex(e.value)}
          />
          <label htmlFor="persistIndex">
            Persist rotation index across server restarts
          </label>
        </div>
      </Panel>

      <Panel header="Default Setup" toggleable className="mb-3">
        <p className="text-color-secondary mt-0">
          Applied every time. Track, vehicle class, session lengths, flags, weather and other
          attributes set here are the baseline every rotation entry builds on.
        </p>
        <DynamicForm
          fieldGroups={defaultSetupGroups}
          values={config.default}
          onChange={handleAttributeChange}
        />
      </Panel>

      <Panel header="Rotation" toggleable className="mb-3">
        <p className="text-color-secondary mt-0">
          Setups to rotate through. Each entry overrides the default setup with only the
          attributes you add below. Leave empty to just repeat the default setup forever.
        </p>
        {config.rotation.map((entry, index) => (
          <RotationEntryPanel
            key={index}
            index={index}
            total={config.rotation.length}
            entry={entry}
            overridableFields={overridableFields}
            onSetAttribute={(name, value) => setRotationAttribute(index, name, value)}
            onRemoveAttribute={(name) => removeRotationAttribute(index, name)}
            onRemove={() => removeRotationEntry(index)}
            onMove={(direction) => moveRotationEntry(index, direction)}
          />
        ))}
        <Button label="Add Entry" icon="pi pi-plus" outlined onClick={addRotationEntry} />
      </Panel>
    </div>
  );
};
