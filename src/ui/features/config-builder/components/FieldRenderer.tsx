import type { ResolvedField } from '../../../../shared/types/config';
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
  HourSelector,
  MonthSelector,
} from './fields';

interface FieldRendererProps {
  field: ResolvedField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export const FieldRenderer = ({
  field,
  value,
  onChange,
  disabled = false,
}: FieldRendererProps) => {
  switch (field.fieldType) {
    case 'number':
  return (
    <NumberField
      field={field}
      value={(value as number) ?? field.min ?? 0}
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

          disabled={disabled}
        />
      );

    case 'vehicle':
      return (
        <VehicleSelector
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}

          disabled={disabled}
        />
      );

    case 'vehicleClass':
      return (
        <VehicleClassSelector
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}

          disabled={disabled}
        />
      );

    case 'weather':
      return (
        <WeatherSelector
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}

          disabled={disabled}
        />
      );

    case 'hour':
      return (
        <HourSelector
          field={field}
          value={(value as number) ?? 0}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'month':
      return (
        <MonthSelector
          field={field}
          value={(value as number) ?? 1}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'year':
      return (
        <SliderField
          field={field}
          value={(value as number) ?? new Date().getFullYear()}
          onChange={onChange}
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