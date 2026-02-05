import React from 'react';
import { InputSwitch } from 'primereact/inputswitch';
import type { FieldMetadata } from '../../types/config-builder.types';

interface SwitchFieldProps {
  field: FieldMetadata;
  value: number | boolean;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  field,
  value,
  onChange,
  disabled = false,
}) => {
  // Convert number to boolean for the switch
  const boolValue = typeof value === 'boolean' ? value : value === 1;

  const handleChange = (checked: boolean) => {
    onChange(checked ? 1 : 0);
  };

  const offLabel = field.booleanLabels?.off ?? 'Disabled';
  const onLabel = field.booleanLabels?.on ?? 'Enabled';

  return (
      <div className="flex align-items-center gap-3">
        <span className={`text-sm ${!boolValue ? 'font-semibold' : 'text-color-secondary'}`}>
          {offLabel}
        </span>
        <InputSwitch
          id={field.name}
          checked={boolValue}
          onChange={(e) => handleChange(e.value)}
          disabled={disabled || field.isReadOnly}
        />
        <span className={`text-sm ${boolValue ? 'font-semibold' : 'text-color-secondary'}`}>
          {onLabel}
        </span>
      </div>
  );
};