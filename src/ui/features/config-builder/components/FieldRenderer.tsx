// src/ui/features/config-builder/components/FieldRenderer.tsx

import React from 'react';
import type { ResolvedField } from '../types/config-builder.types';
import {
  TextField,
  NumberField,
  SliderField,
  SwitchField,
  DropdownField,
  FlagsField,
  TrackSelector,
  VehicleSelector,
  VehicleClassSelector,
  WeatherSelector,
} from './fields';
import { InputNumber } from 'primereact/inputnumber';

interface FieldRendererProps {
  field: ResolvedField;
  value: unknown;
  onChange: (value: unknown) => void;
  connectionId: string | null;
  disabled?: boolean;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  connectionId,
  disabled = false,
}) => {
  switch (field.fieldType) {
    case 'number':
  return (
    <NumberField
      field={field}
      value={(value as number) ?? 0}
      onChange={onChange}
      disabled={disabled}
    />
  );
    case 'text':
      return (
        <TextField
          field={field}
          value={(value as string) ?? ''}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'slider':
      return (
        <SliderField
          field={field}
          value={(value as number) ?? field.min ?? 0}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'switch':
      return (
        <SwitchField
          field={field}
          value={(value as number | boolean) ?? 0}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'dropdown':
      return (
        <DropdownField
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'flags':
      return (
        <FlagsField
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'track':
      return (
        <TrackSelector
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}
          connectionId={connectionId}
          disabled={disabled}
        />
      );

    case 'vehicle':
      return (
        <VehicleSelector
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}
          connectionId={connectionId}
          disabled={disabled}
        />
      );

    case 'vehicleClass':
      return (
        <VehicleClassSelector
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}
          connectionId={connectionId}
          disabled={disabled}
        />
      );

    case 'weather':
      return (
        <WeatherSelector
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}
          connectionId={connectionId}
          disabled={disabled}
        />
      );

    case 'readonly':
      return (
          <div className="p-inputtext p-disabled surface-200 p-2 border-round">
            {String(value ?? 'N/A')}
          </div>
      );

    default:
      return (
          <div className="text-color-secondary">
            Unsupported field type: {field.fieldType}
          </div>
      );
  }
};