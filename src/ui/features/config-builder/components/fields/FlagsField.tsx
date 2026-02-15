// src/ui/features/config-builder/components/fields/FlagsField.tsx

import { useMemo, useCallback } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Panel } from 'primereact/panel';
import { formatLabel } from '../../utils/schema-processor';
import { isFlagSet, toggleFlag } from '../../utils/flags-helper';
import type { ResolvedField } from '../../../../../shared/types/config';

interface FlagsFieldProps {
  field: ResolvedField;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const FlagsField = ({
  field,
  value,
  onChange,
  disabled = false,
}: FlagsFieldProps) => {
  const flags = field.flagOptions ?? [];

  const handleFlagToggle = useCallback((flagValue: number, checked: boolean) => {
    const newValue = toggleFlag(value, flagValue, checked);
    onChange(newValue);
  }, [value, onChange]);

  // Group flags into columns for better layout
  const columns = useMemo(() => {
    const cols: typeof flags[] = [[], [], []];
    flags.forEach((flag, index) => {
      cols[index % 3].push(flag);
    });
    return cols;
  }, [flags]);

  return (
      <Panel header={field.label} toggleable>
        <small className="text-color-secondary block mb-3">
          {field.description}
        </small>
        <div className="grid">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="col-12 md:col-4">
              {column.map(flag => {
                const isChecked = isFlagSet(value, flag.value);
                return (
                  <div key={flag.value} className="flex align-items-center mb-2">
                    <Checkbox
                      inputId={`${field.name}-${flag.value}`}
                      checked={isChecked}
                      onChange={(e) => handleFlagToggle(flag.value, e.checked ?? false)}
                      disabled={disabled || field.isReadOnly}
                    />
                    <label
                      htmlFor={`${field.name}-${flag.value}`}
                      className="ml-2 cursor-pointer"
                    >
                      {formatLabel(flag.name)}
                    </label>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-top-1 surface-border">
          <small className="text-color-secondary">
            Combined value: <code className="font-bold">{value}</code>
          </small>
        </div>
      </Panel>
  );
};