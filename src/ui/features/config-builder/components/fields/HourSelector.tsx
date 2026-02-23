// src/ui/features/config-builder/components/fields/HourSelector.tsx

import { useMemo } from 'react';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import type { FieldMetadata } from '../../../../../shared/types/config';

interface HourSelectorProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const HourSelector = ({
  field,
  value,
  onChange,
  disabled = false,
}: HourSelectorProps) => {
  const options = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      label: `${i.toString().padStart(2, '0')}:00`,
      value: i,
    })),
  []);

  return (
    <Dropdown
      id={field.name}
      value={value}
      options={options}
      onChange={(e: DropdownChangeEvent) => onChange(e.value)}
      disabled={disabled || field.isReadOnly}
      placeholder="Select hour..."
      className="w-full"
    />
  );
};
