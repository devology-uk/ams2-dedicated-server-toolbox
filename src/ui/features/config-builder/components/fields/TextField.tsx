import React from 'react';
import { InputText } from 'primereact/inputtext';
import type { FieldMetadata } from '../../types/config-builder.types';

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
      <InputText
        id={field.name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.isReadOnly}
        className="w-full"
        tooltip={field.description}
        tooltipOptions={{ position: 'top' }}
      />
  );
};