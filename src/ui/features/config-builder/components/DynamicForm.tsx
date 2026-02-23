// src/ui/features/config-builder/components/DynamicForm.tsx

import { FieldRenderer } from './FieldRenderer';
import { FormField } from './FormField';
import type { FieldGroup, SessionAttributes } from '../../../../shared/types/config';

interface DynamicFormProps {
  fieldGroups: FieldGroup[];
  values: SessionAttributes;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
}

export const DynamicForm = ({
  fieldGroups,
  values,
  onChange,
  disabled = false,
}: DynamicFormProps) => {
  return (
    <div className="dynamic-form">
      {fieldGroups.map(group => (
        <div key={group.id} className="mb-4">
          <div className="flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 surface-border">
            <i className={`${group.icon} text-color-secondary`}></i>
            <span className="font-semibold">{group.label}</span>
          </div>
          <div className="formgrid grid">
            {group.fields.map(field => {

              if(field.fieldType === 'readonly') {
                return null
              }

              // Flags get full width, no FormField wrapper
              if (field.fieldType === 'flags') {
                return (
                  <div key={field.name} className="col-12 mb-3">
                    <FieldRenderer
                      field={field}
                      value={values[field.name]}
                      onChange={(value) => onChange(field.name, value)}
                      disabled={disabled}
                    />
                  </div>
                );
              }

              return (
                <FormField key={field.name} field={field}>
                  <FieldRenderer
                    field={field}
                    value={values[field.name]}
                    onChange={(value) => onChange(field.name, value)}
                    disabled={disabled}
                  />
                </FormField>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};