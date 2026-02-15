import type { ReactNode } from 'react';
import type { ResolvedField } from '../../../../shared/types/config';

interface FormFieldProps {
  field: ResolvedField;
  children: ReactNode;
}

export const FormField = ({ field, children }: FormFieldProps) => {
  return (
    <>
      <label
        htmlFor={field.name}
        className="col-12 md:col-4 flex align-items-center font-medium"
      >
        {field.label}
      </label>
      <div className="col-12 md:col-8 mb-3">
        {children}
        {field.description && (
          <small className="text-color-secondary block mt-1">
            {field.description}
          </small>
        )}
      </div>
    </>
  );
};