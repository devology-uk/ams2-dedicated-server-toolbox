import { useState, useEffect, useMemo, type RefObject } from 'react';

import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { SelectButton } from 'primereact/selectbutton';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import type { Toast } from 'primereact/toast';

import type {
  AllListsData,
  ExportField,
  ExportPreset,
  ExportPresetInput,
} from '../../../../shared/types/index.js';
import {
  buildExportRows,
  getAvailableFields,
  getExportColumns,
  lookupColumnKey,
  rowsToCsv,
  rowsToJson,
  type ExportSpec,
} from './buildExport.js';
import './ExportDialog.scss';

interface EndpointOption {
  path: string;
  label: string;
}

interface ExportDialogProps {
  visible: boolean;
  onHide: () => void;
  lists: AllListsData;
  endpoints: EndpointOption[];
  toast: RefObject<Toast | null>;
}

interface EditableLookup {
  key: string;
  endpoint: string;
  localField: string;
  foreignField: string;
  fields: string[];
}

let lookupKeyCounter = 0;
function nextLookupKey(): string {
  lookupKeyCounter += 1;
  return `lookup-${lookupKeyCounter}`;
}

const emptyLookup = (): EditableLookup => ({
  key: nextLookupKey(),
  endpoint: '',
  localField: '',
  foreignField: '',
  fields: [],
});

function withAlias(field: string, aliases: Record<string, string>, key: string = field): ExportField {
  return aliases[key] ? { field, alias: aliases[key] } : { field };
}

const formatOptions = [
  { label: 'CSV', value: 'csv' as const },
  { label: 'JSON', value: 'json' as const },
];

const PREVIEW_ROW_LIMIT = 5;

export const ExportDialog = ({ visible, onHide, lists, endpoints, toast }: ExportDialogProps) => {
  const [presets, setPresets] = useState<ExportPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');
  const [primaryEndpoint, setPrimaryEndpoint] = useState('');
  const [fields, setFields] = useState<string[]>([]);
  const [lookups, setLookups] = useState<EditableLookup[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [format, setFormat] = useState<'json' | 'csv'>('csv');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (visible) {
      window.electron.exportPresets.getAll().then(setPresets);
    }
  }, [visible]);

  const resetForm = () => {
    setSelectedPresetId(null);
    setPresetName('');
    setPrimaryEndpoint('');
    setFields([]);
    setLookups([]);
    setAliases({});
    setColumnOrder([]);
    setIncludeHeaders(true);
    setFormat('csv');
  };

  const applyPreset = (preset: ExportPreset) => {
    setSelectedPresetId(preset.id);
    setPresetName(preset.name);
    setPrimaryEndpoint(preset.primaryEndpoint);
    setFields(preset.fields.map((f) => f.field));
    setLookups(preset.lookups.map((lookup) => ({
      key: nextLookupKey(),
      endpoint: lookup.endpoint,
      localField: lookup.localField,
      foreignField: lookup.foreignField,
      fields: lookup.fields.map((f) => f.field),
    })));

    const aliasMap: Record<string, string> = {};
    preset.fields.forEach((f) => {
      if (f.alias) aliasMap[f.field] = f.alias;
    });
    preset.lookups.forEach((lookup) => {
      lookup.fields.forEach((f) => {
        if (f.alias) aliasMap[lookupColumnKey(lookup, f.field)] = f.alias;
      });
    });
    setAliases(aliasMap);
    setColumnOrder(preset.columnOrder);
    setIncludeHeaders(preset.includeHeaders);
    setFormat(preset.format);
  };

  const handlePresetChange = (id: string | null) => {
    if (!id) {
      resetForm();
      return;
    }
    const preset = presets.find((p) => p.id === id);
    if (preset) applyPreset(preset);
  };

  const primaryFieldOptions = useMemo(
    () => (primaryEndpoint ? getAvailableFields(lists, primaryEndpoint) : []),
    [lists, primaryEndpoint],
  );

  const handlePrimaryEndpointChange = (path: string) => {
    setPrimaryEndpoint(path);
    setFields([]);
    setLookups([]);
    setAliases({});
    setColumnOrder([]);
  };

  const updateLookup = (key: string, changes: Partial<EditableLookup>) => {
    setLookups((prev) => prev.map((lookup) => (lookup.key === key ? { ...lookup, ...changes } : lookup)));
  };

  const addLookup = () => setLookups((prev) => [...prev, emptyLookup()]);
  const removeLookup = (key: string) => setLookups((prev) => prev.filter((lookup) => lookup.key !== key));

  const isConfigValid = primaryEndpoint !== '' && fields.length > 0;

  const exportSpec: ExportSpec = useMemo(() => ({
    primaryEndpoint,
    fields: fields.map((field) => withAlias(field, aliases)),
    lookups: lookups.map((lookup) => ({
      endpoint: lookup.endpoint,
      localField: lookup.localField,
      foreignField: lookup.foreignField,
      fields: lookup.fields.map((field) => withAlias(field, aliases, lookupColumnKey(lookup, field))),
    })),
    columnOrder,
  }), [primaryEndpoint, fields, lookups, aliases, columnOrder]);

  const columns = useMemo(() => getExportColumns(exportSpec), [exportSpec]);

  const previewContent = useMemo(() => {
    if (!isConfigValid) return '';
    const previewRows = buildExportRows(lists, exportSpec).slice(0, PREVIEW_ROW_LIMIT);
    if (previewRows.length === 0) return '';
    return format === 'csv'
      ? rowsToCsv(previewRows, columns, includeHeaders)
      : rowsToJson(previewRows, columns);
  }, [isConfigValid, lists, exportSpec, columns, format, includeHeaders]);

  const setColumnAlias = (key: string, value: string) => {
    setAliases((prev) => {
      const next = { ...prev };
      if (value.trim()) {
        next[key] = value;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const moveColumn = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const newOrder = columns.map((column) => column.key);
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setColumnOrder(newOrder);
  };

  const buildPresetInput = (): ExportPresetInput => ({
    id: selectedPresetId ?? undefined,
    name: presetName.trim(),
    primaryEndpoint: exportSpec.primaryEndpoint,
    fields: exportSpec.fields,
    lookups: exportSpec.lookups,
    columnOrder: columns.map((column) => column.key),
    includeHeaders,
    format,
  });

  const handleSavePreset = async () => {
    if (!presetName.trim() || !isConfigValid) return;
    setSaving(true);
    try {
      const saved = await window.electron.exportPresets.save(buildPresetInput());
      setPresets(await window.electron.exportPresets.getAll());
      setSelectedPresetId(saved.id);
      toast.current?.show({
        severity: 'success',
        summary: 'Preset Saved',
        detail: `"${saved.name}" saved`,
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePreset = async () => {
    if (!selectedPresetId) return;
    await window.electron.exportPresets.delete(selectedPresetId);
    setPresets(await window.electron.exportPresets.getAll());
    resetForm();
  };

  const handleExport = async () => {
    if (!isConfigValid) return;
    setExporting(true);
    try {
      const rows = buildExportRows(lists, exportSpec);
      const content = format === 'csv' ? rowsToCsv(rows, columns, includeHeaders) : rowsToJson(rows, columns);
      const baseName = (presetName.trim() || primaryEndpoint).replace(/[^a-z0-9]+/gi, '_');
      const filename = `${baseName}.${format}`;

      const result = await window.electron.exportResults({ filename, content, format });

      if (result.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Export Complete',
          detail: `${rows.length} rows exported`,
          life: 3000,
        });
      } else if (!result.cancelled) {
        toast.current?.show({
          severity: 'error',
          summary: 'Export Failed',
          detail: result.error || 'Failed to write export file',
          life: 4000,
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const dialogFooter = (
    <div className="dialog-footer">
      <Button label="Close" icon="pi pi-times" className="p-button-text" onClick={onHide} />
      <Button
        label={exporting ? 'Exporting...' : 'Export'}
        icon={exporting ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
        disabled={!isConfigValid || exporting}
        onClick={handleExport}
      />
    </div>
  );

  return (
    <Dialog
      header="Export API Data"
      visible={visible}
      onHide={onHide}
      footer={dialogFooter}
      className="export-dialog"
      modal
      draggable={false}
      style={{ width: '102rem' }}
    >
      <div className="export-dialog-columns">
        <div className="p-fluid export-setup-column">
          <div className="field">
            <label>Saved Preset</label>
            <div className="p-inputgroup">
              <Dropdown
                value={selectedPresetId}
                options={presets}
                optionLabel="name"
                optionValue="id"
                placeholder="— New export —"
                showClear
                onChange={(e) => handlePresetChange(e.value)}
              />
              <Button
                icon="pi pi-trash"
                className="p-button-outlined p-button-danger"
                disabled={!selectedPresetId}
                onClick={handleDeletePreset}
                tooltip="Delete preset"
              />
            </div>
          </div>

          <Divider />

          <div className="field">
            <label>Primary Endpoint</label>
            <Dropdown
              value={primaryEndpoint}
              options={endpoints}
              optionLabel="label"
              optionValue="path"
              placeholder="Select an endpoint..."
              filter
              onChange={(e) => handlePrimaryEndpointChange(e.value)}
            />
          </div>

          {primaryEndpoint && (
            <div className="field">
              <label>Fields to Include</label>
              <MultiSelect
                value={fields}
                options={primaryFieldOptions}
                onChange={(e) => setFields(e.value)}
                placeholder="Select fields..."
                display="chip"
                filter
              />
            </div>
          )}

          {primaryEndpoint && (
            <div className="field">
              <div className="export-lookups-header">
                <label className="m-0">Combine With Other Endpoints</label>
                <Button label="Add Lookup" icon="pi pi-plus" className="p-button-text p-button-sm" onClick={addLookup} />
              </div>

              {lookups.map((lookup) => {
                const lookupFieldOptions = lookup.endpoint ? getAvailableFields(lists, lookup.endpoint) : [];
                return (
                  <div key={lookup.key} className="export-lookup-row">
                    <Dropdown
                      value={lookup.endpoint}
                      options={endpoints.filter((e) => e.path !== primaryEndpoint)}
                      optionLabel="label"
                      optionValue="path"
                      placeholder="Endpoint..."
                      filter
                      onChange={(e) => updateLookup(lookup.key, { endpoint: e.value, foreignField: '', fields: [] })}
                    />
                    <span className="export-lookup-join">where</span>
                    <Dropdown
                      value={lookup.localField}
                      options={primaryFieldOptions}
                      placeholder="local field"
                      onChange={(e) => updateLookup(lookup.key, { localField: e.value })}
                    />
                    <span className="export-lookup-join">=</span>
                    <Dropdown
                      value={lookup.foreignField}
                      options={lookupFieldOptions}
                      placeholder="their field"
                      disabled={!lookup.endpoint}
                      onChange={(e) => updateLookup(lookup.key, { foreignField: e.value })}
                    />
                    <MultiSelect
                      value={lookup.fields}
                      options={lookupFieldOptions}
                      placeholder="bring in..."
                      disabled={!lookup.endpoint}
                      display="chip"
                      onChange={(e) => updateLookup(lookup.key, { fields: e.value })}
                    />
                    <Button
                      icon="pi pi-times"
                      className="p-button-text p-button-danger"
                      onClick={() => removeLookup(lookup.key)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <Divider />

          <div className="field">
            <label>Format</label>
            <SelectButton value={format} options={formatOptions} onChange={(e) => e.value && setFormat(e.value)} />
          </div>

          {format === 'csv' && (
            <div className="field">
              <div className="flex align-items-center gap-2">
                <Checkbox
                  inputId="includeHeaders"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(!!e.checked)}
                />
                <label htmlFor="includeHeaders" className="m-0">Include column headers</label>
              </div>
            </div>
          )}

          <div className="field">
            <label>Preset Name</label>
            <div className="p-inputgroup">
              <InputText
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., WordPress Cars CSV"
              />
              <Button
                label="Save Preset"
                icon="pi pi-save"
                className="p-button-outlined"
                disabled={!presetName.trim() || !isConfigValid || saving}
                onClick={handleSavePreset}
              />
            </div>
          </div>
        </div>

        <div className="p-fluid export-output-column">
          {columns.length > 0 ? (
            <>
              <div className="field">
                <label>Output Columns</label>
                <p className="export-columns-hint">Set an alias to rename a column, and reorder with the arrows.</p>
                <div className="export-columns-list">
                  {columns.map((column, index) => (
                    <div key={column.key} className="export-column-row">
                      <span className="export-column-key" title={column.key}>{column.key}</span>
                      <InputText
                        value={aliases[column.key] ?? ''}
                        onChange={(e) => setColumnAlias(column.key, e.target.value)}
                        placeholder="Alias (optional)"
                      />
                      <div className="export-column-reorder">
                        <Button
                          icon="pi pi-chevron-up"
                          className="p-button-text p-button-sm"
                          disabled={index === 0}
                          onClick={() => moveColumn(index, -1)}
                          tooltip="Move up"
                        />
                        <Button
                          icon="pi pi-chevron-down"
                          className="p-button-text p-button-sm"
                          disabled={index === columns.length - 1}
                          onClick={() => moveColumn(index, 1)}
                          tooltip="Move down"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Preview (first {PREVIEW_ROW_LIMIT} rows)</label>
                <pre className="export-preview-code">{previewContent}</pre>
              </div>
            </>
          ) : (
            <div className="export-output-placeholder">
              <i className="pi pi-table"></i>
              <p>Selected fields and columns will appear here</p>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
