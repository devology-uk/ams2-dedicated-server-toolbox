// src/ui/features/config-builder/components/fields/SliderField.tsx

import { Slider } from 'primereact/slider';
import { InputNumber } from 'primereact/inputnumber';
import type { FieldMetadata } from '../../../../../shared/types/config';

interface SliderFieldProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const SliderField = ({
  field,
  value,
  onChange,
  disabled = false,
}: SliderFieldProps) => {
  const min = field.min ?? 0;
  const max = field.max ?? 100;

  return (
      <div className="flex align-items-center gap-3">
        <div className="flex-grow-1">
          <Slider
            id={field.name}
            value={value}
            onChange={(e) => onChange(e.value as number)}
            disabled={disabled || field.isReadOnly}
            min={min}
            max={max}
            className="w-full"
          />
        </div>
        <InputNumber
          value={value}
          onValueChange={(e) => onChange(e.value ?? min)}
          disabled={disabled || field.isReadOnly}
          min={min}
          max={max}
          className="w-5rem"
        />
      </div>
  );
};