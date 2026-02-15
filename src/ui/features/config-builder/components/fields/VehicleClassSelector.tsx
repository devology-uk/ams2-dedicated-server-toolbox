// src/ui/features/config-builder/components/fields/VehicleClassSelector.tsx

import { useMemo } from 'react';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { useServerCache } from '../../hooks/useServerCache';
import type { FieldMetadata } from '../../../../../shared/types/config';

interface VehicleClassSelectorProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const VehicleClassSelector = ({
  field,
  value,
  onChange,
  disabled = false,
}: VehicleClassSelectorProps) => {
  const { getVehicleClasses } = useServerCache();
  const vehicleClasses = getVehicleClasses();

  const options = useMemo(() => {
    return vehicleClasses
      .map(vc => ({
        label: vc.translated_name,
        value: vc.value,
        name: vc.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [vehicleClasses]);

  const selectedClass = useMemo(() => {
    return vehicleClasses.find(vc => vc.value === value);
  }, [vehicleClasses, value]);

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
        placeholder="Select a vehicle class..."
        className="w-full"
        virtualScrollerOptions={{ itemSize: 40 }}
        showClear
      />
      {selectedClass && (
        <small className="text-color-secondary block mt-1">
          Internal name: {selectedClass.name}
        </small>
      )}
    </>
  );
};