// src/ui/features/config-builder/components/fields/MonthSelector.tsx

import { useMemo } from 'react';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import type { FieldMetadata } from '../../../../../shared/types/config';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthSelectorProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const MonthSelector = ({
  field,
  value,
  onChange,
  disabled = false,
}: MonthSelectorProps) => {
  const options = useMemo(() =>
    MONTH_NAMES.map((name, i) => ({
      label: name,
      value: i + 1,
    })),
  []);

  return (
    <Dropdown
      id={field.name}
      value={value}
      options={options}
      onChange={(e: DropdownChangeEvent) => onChange(e.value)}
      disabled={disabled || field.isReadOnly}
      placeholder="Select month..."
      className="w-full"
    />
  );
};
