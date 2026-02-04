// src/ui/features/config-builder/components/fields/WeatherSelector.tsx

import React, { useMemo } from 'react';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { useServerCache } from '../../hooks/useServerCache';
import type { FieldMetadata } from '../../types/config-builder.types';
import { formatLabel } from '../../utils/schema-processor';

interface WeatherSelectorProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  connectionId: string | null;
  disabled?: boolean;
}

export const WeatherSelector: React.FC<WeatherSelectorProps> = ({
  field,
  value,
  onChange,
  connectionId,
  disabled = false,
}) => {
  const { getEnum } = useServerCache(connectionId);
  const weatherOptions = getEnum('weather');

  const options = useMemo(() => {
    return weatherOptions.map(w => ({
      label: formatLabel(w.name),
      value: w.value,
    }));
  }, [weatherOptions]);

  return (
    <div className="field">
      <label htmlFor={field.name} className="block font-medium mb-2">
        {field.label}
      </label>
      <Dropdown
        id={field.name}
        value={value}
        options={options}
        onChange={(e: DropdownChangeEvent) => onChange(e.value)}
        disabled={disabled || field.isReadOnly}
        filter
        filterBy="label"
        placeholder="Select weather..."
        className="w-full"
        showClear
      />
    </div>
  );
};