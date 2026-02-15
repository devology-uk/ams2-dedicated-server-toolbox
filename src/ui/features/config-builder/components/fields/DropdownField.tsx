// src/ui/features/config-builder/components/fields/DropdownField.tsx

import { useMemo } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { formatLabel } from '../../utils/schema-processor';
import type { ResolvedField } from '../../../../../shared/types/config';

interface DropdownFieldProps {
  field: ResolvedField;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const DropdownField = ({
  field,
  value,
  onChange,
  disabled = false,
}: DropdownFieldProps) => {
  const options = useMemo(() => {
    return (field.enumOptions ?? []).map(item => ({
      label: formatLabel(item.name),
      value: item.value,
    }));
  }, [field.enumOptions]);

  return (
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
  );
};