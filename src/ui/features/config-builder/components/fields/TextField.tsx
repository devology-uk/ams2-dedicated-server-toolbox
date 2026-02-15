import { InputText } from 'primereact/inputtext';
import type { FieldMetadata } from '../../../../../shared/types/config';

interface TextFieldProps {
  field: FieldMetadata;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TextField = ({
  field,
  value,
  onChange,
  disabled = false,
}: TextFieldProps) => {
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