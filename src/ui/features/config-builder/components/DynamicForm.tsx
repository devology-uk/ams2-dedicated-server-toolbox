// src/ui/features/config-builder/components/DynamicForm.tsx

import React from 'react';
import { Panel } from 'primereact/panel';
import { FieldRenderer } from './FieldRenderer';
import type { FieldGroup, SessionAttributes } from '../types/config-builder.types';

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
          <div className="grid">
            {group.fields.map(field => (
              <div key={field.name} className="col-12 md:col-6 lg:col-4">
                <FieldRenderer
                  field={field}
                  value={values[field.name]}
                  onChange={(value) => onChange(field.name, value)}
                  connectionId={connectionId}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
};