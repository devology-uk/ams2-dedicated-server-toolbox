
import { InputNumber } from 'primereact/inputnumber';
import type { FieldMetadata } from '../../../../../shared/types/config';

interface NumberFieldProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const NumberField = ({
  field,
  value,
  onChange,
  disabled = false,
}: NumberFieldProps) => {
  return (
    <InputNumber
      id={field.name}
      value={value}
      onValueChange={(e) => onChange(e.value ?? 0)}
      disabled={disabled || field.isReadOnly}
      min={field.min}
      max={field.max}
      showButtons
      className="w-full"
    />
  );
};