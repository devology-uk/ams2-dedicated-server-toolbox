// src/ui/features/sms-rotate/components/RotationEntryPanel.tsx

import { useMemo, useState } from 'react';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { AutoComplete, type AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { FormField } from '../../config-builder/components/FormField';
import { FieldRenderer } from '../../config-builder/components/FieldRenderer';
import type { ResolvedField, SmsRotateSetup } from '../../../../shared/types/config';

interface RotationEntryPanelProps {
  index: number;
  total: number;
  entry: SmsRotateSetup;
  overridableFields: ResolvedField[];
  onSetAttribute: (name: string, value: number) => void;
  onRemoveAttribute: (name: string) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}

export const RotationEntryPanel = ({
  index,
  total,
  entry,
  overridableFields,
  onSetAttribute,
  onRemoveAttribute,
  onRemove,
  onMove,
}: RotationEntryPanelProps) => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<ResolvedField[]>([]);

  const activeNames = useMemo(() => new Set(Object.keys(entry)), [entry]);
  const activeFields = overridableFields.filter(f => activeNames.has(f.name));
  const pickableFields = overridableFields.filter(f => !activeNames.has(f.name));

  const handleSearch = ({ query }: AutoCompleteCompleteEvent) => {
    const q = query.toLowerCase();
    setSuggestions(pickableFields.filter(f => f.label.toLowerCase().includes(q)));
  };

  const handleSelect = (field: ResolvedField) => {
    setSearch('');
    onSetAttribute(field.name, field.min ?? 0);
  };

  const header = (
    <div className="flex align-items-center justify-content-between w-full pr-2">
      <span className="font-semibold">
        Setup #{index + 1}
        {activeFields.length > 0 && (
          <span className="text-color-secondary font-normal ml-2 text-sm">
            {activeFields.length} attribute{activeFields.length === 1 ? '' : 's'} overridden
          </span>
        )}
      </span>
      <div className="flex gap-1">
        <Button
          icon="pi pi-arrow-up"
          rounded
          text
          size="small"
          disabled={index === 0}
          onClick={onMove.bind(null, -1)}
          tooltip="Move up"
        />
        <Button
          icon="pi pi-arrow-down"
          rounded
          text
          size="small"
          disabled={index === total - 1}
          onClick={onMove.bind(null, 1)}
          tooltip="Move down"
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          size="small"
          severity="danger"
          onClick={onRemove}
          tooltip="Remove this entry"
        />
      </div>
    </div>
  );

  return (
    <Panel header={header} toggleable className="mb-3">
      <div className="mb-3">
        <AutoComplete
          value={search}
          suggestions={suggestions}
          field="label"
          placeholder="Add attribute override..."
          className="w-full"
          inputClassName="w-full"
          completeMethod={handleSearch}
          onChange={(e) => setSearch(typeof e.value === 'string' ? e.value : e.value?.label ?? '')}
          onSelect={(e) => handleSelect(e.value as ResolvedField)}
        />
      </div>

      {activeFields.length === 0 && (
        <p className="text-color-secondary m-0">
          No overrides — this entry will use the default setup unchanged.
        </p>
      )}

      <div className="formgrid grid">
        {activeFields.map((field) => {
          // Scope ids to this entry so they don't collide with the Default Setup
          // form or other rotation entries rendered in the same tab.
          const scopedField = { ...field, name: `rotation-${index}-${field.name}` };

          const removeButton = (
            <Button
              icon="pi pi-times"
              rounded
              text
              size="small"
              severity="secondary"
              className="ml-2"
              onClick={() => onRemoveAttribute(field.name)}
              tooltip="Remove this override"
            />
          );

          if (field.fieldType === 'flags') {
            return (
              <div key={field.name} className="col-12 mb-3 flex align-items-start">
                <div className="flex-grow-1">
                  <FieldRenderer
                    field={scopedField}
                    value={entry[field.name]}
                    onChange={(value) => onSetAttribute(field.name, value as number)}
                  />
                </div>
                {removeButton}
              </div>
            );
          }

          return (
            <FormField key={field.name} field={scopedField}>
              <div className="flex align-items-center">
                <div className="flex-grow-1">
                  <FieldRenderer
                    field={scopedField}
                    value={entry[field.name]}
                    onChange={(value) => onSetAttribute(field.name, value as number)}
                  />
                </div>
                {removeButton}
              </div>
            </FormField>
          );
        })}
      </div>
    </Panel>
  );
};
