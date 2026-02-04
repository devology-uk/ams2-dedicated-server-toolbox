// src/ui/features/config-builder/components/fields/NumberField.tsx

import React from 'react';
import { InputNumber } from 'primereact/inputnumber';
import type { FieldMetadata } from '../../types/config-builder.types';

interface NumberFieldProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  field,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="field">
      <label htmlFor={field.name} className="block font-medium mb-2">
        {field.label}
      </label>
      <InputNumber
        id={field.name}
        value={value}
        onValueChange={(e) => onChange(e.value ?? 0)}
        disabled={disabled || field.isReadOnly}
        min={field.min}
        max={field.max}
        showButtons
        className="w-full"
        tooltip={field.description}
        tooltipOptions={{ position: 'top' }}
      />
      {(field.min !== undefined || field.max !== undefined) && (
        <small className="text-color-secondary block mt-1">
          Range: {field.min ?? '∞'} - {field.max ?? '∞'}
        </small>
      )}
    </div>
  );
};