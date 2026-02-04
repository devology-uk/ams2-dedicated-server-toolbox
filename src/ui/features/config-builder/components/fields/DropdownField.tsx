// src/ui/features/config-builder/components/fields/DropdownField.tsx

import React, { useMemo } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { formatLabel } from '../../utils/schema-processor';
import type { ResolvedField } from '../../types/config-builder.types';

interface DropdownFieldProps {
  field: ResolvedField;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({
  field,
  value,
  onChange,
  disabled = false,
}) => {
  const options = useMemo(() => {
    return (field.enumOptions ?? []).map(item => ({
      label: formatLabel(item.name),
      value: item.value,
    }));
  }, [field.enumOptions]);

  return (
    <div className="field">
      <label htmlFor={field.name} className="block font-medium mb-2">
        {field.label}
      </label>
      <Dropdown
        id={field.name}
        value={value}
        options={options}
        onChange={(e) => onChange(e.value)}
        disabled={disabled || field.isReadOnly}
        placeholder="Select..."
        className="w-full"
        tooltip={field.description}
        tooltipOptions={{ position: 'top' }}
      />
      <small className="text-color-secondary block mt-1">
        {field.description}
      </small>
    </div>
  );
};