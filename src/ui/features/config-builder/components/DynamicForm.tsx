// src/ui/features/config-builder/components/DynamicForm.tsx

import React from 'react';
import { Panel } from 'primereact/panel';
import { FieldRenderer } from './FieldRenderer';
import { FormField } from './FormField';
import type { FieldGroup, SessionAttributes } from '../../../../shared/types/config';

interface DynamicFormProps {
  fieldGroups: FieldGroup[];
  values: SessionAttributes;
  onChange: (name: string, value: unknown) => void;
  connectionId: string | null;
  disabled?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fieldGroups,
  values,
  onChange,
  connectionId,
  disabled = false,
}) => {
  return (
    <div className="dynamic-form">
      {fieldGroups.map(group => (
        <Panel
          key={group.id}
          header={
            <span className="flex align-items-center gap-2">
              <i className={group.icon}></i>
              <span>{group.label}</span>
            </span>
          }
          toggleable
          collapsed={false}
          className="mb-3"
        >
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
                      connectionId={connectionId}
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
                    connectionId={connectionId}
                    disabled={disabled}
                  />
                </FormField>
              );
            })}
          </div>
        </Panel>
      ))}
    </div>
  );
};