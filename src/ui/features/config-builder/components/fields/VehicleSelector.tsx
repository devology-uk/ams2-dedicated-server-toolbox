// src/ui/features/config-builder/components/fields/VehicleSelector.tsx

import React, { useMemo } from 'react';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { useServerCache } from '../../hooks/useServerCache';
import type { FieldMetadata } from '../../types/config-builder.types';

interface VehicleSelectorProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  connectionId: string | null;
  disabled?: boolean;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  field,
  value,
  onChange,
  connectionId,
  disabled = false,
}) => {
  const { getVehicles } = useServerCache(connectionId);
  const vehicles = getVehicles();

  // Group vehicles by class
  const groupedOptions = useMemo(() => {
    const byClass = new Map<string, { label: string; value: number }[]>();

    for (const vehicle of vehicles) {
      const className = vehicle.class ?? 'Other';
      if (!byClass.has(className)) {
        byClass.set(className, []);
      }
      byClass.get(className)!.push({
        label: vehicle.name,
        value: vehicle.id,
      });
    }

    // Sort classes and convert to grouped format
    const groups: { label: string; items: { label: string; value: number }[] }[] = [];
    const sortedClasses = Array.from(byClass.keys()).sort();

    for (const className of sortedClasses) {
      const items = byClass.get(className)!;
      items.sort((a, b) => a.label.localeCompare(b.label));
      groups.push({
        label: className,
        items,
      });
    }

    return groups;
  }, [vehicles]);

  // Find selected vehicle for display
  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === value);
  }, [vehicles, value]);

  return (
    <div className="field">
      <label htmlFor={field.name} className="block font-medium mb-2">
        {field.label}
      </label>
      <Dropdown
        id={field.name}
        value={value}
        options={groupedOptions}
        optionLabel="label"
        optionValue="value"
        optionGroupLabel="label"
        optionGroupChildren="items"
        onChange={(e: DropdownChangeEvent) => onChange(e.value)}
        disabled={disabled || field.isReadOnly}
        filter
        filterBy="label"
        placeholder="Select a vehicle..."
        className="w-full"
        virtualScrollerOptions={{ itemSize: 40 }}
        showClear
      />
      {selectedVehicle && (
        <small className="text-color-secondary block mt-1">
          Class: {selectedVehicle.class ?? 'Unknown'}
        </small>
      )}
    </div>
  );
};