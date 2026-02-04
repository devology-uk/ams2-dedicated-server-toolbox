// src/ui/features/config-builder/components/fields/TextField.tsx

import React from 'react';
import { InputText } from 'primereact/inputtext';
import { FieldMetadata } from '../types';

interface TextFieldProps {
  field: FieldMetadata;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
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
      <InputText
        id={field.name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.isReadOnly}
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