// src/ui/features/config-builder/components/fields/WeatherSelector.tsx

import { useMemo } from 'react';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { useServerCache } from '../../hooks/useServerCache';
import type { FieldMetadata } from '../../../../../shared/types/config';
import { formatLabel } from '../../utils/schema-processor';

interface WeatherSelectorProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const WeatherSelector = ({
  field,
  value,
  onChange,
  disabled = false,
}: WeatherSelectorProps) => {
  const { getEnum } = useServerCache();
  const weatherOptions = getEnum('weather');

  const options = useMemo(() => {
    return weatherOptions.map(w => ({
      label: formatLabel(w.name),
      value: w.value,
    }));
  }, [weatherOptions]);

  return (
    <>
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
    </>
  );
};