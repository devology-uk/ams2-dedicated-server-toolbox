// src/ui/features/config-builder/components/ExportPreviewDialog.tsx

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import type { ValidationIssue } from '../utils/config-validation';

interface ExportPreviewDialogProps {
  visible: boolean;
  onHide: () => void;
  content: string;
  issues: ValidationIssue[];
  onSave: () => void;
}

export const ExportPreviewDialog = ({
  visible,
  onHide,
  content,
  issues,
  onSave,
}: ExportPreviewDialogProps) => {
  const hasErrors = issues.some(i => i.severity === 'error');

  return (
    <Dialog
      header="Export Preview"
      visible={visible}
      onHide={onHide}
      style={{ width: '70vw', height: '80vh' }}
      contentClassName="export-preview-content"
      footer={
        <div className="flex justify-content-end gap-2">
          <Button label="Cancel" severity="secondary" onClick={onHide} />
          <Button
            label="Save"
            icon="pi pi-download"
            severity="success"
            disabled={hasErrors}
            onClick={onSave}
          />
        </div>
      }
    >
      {issues.length > 0 && (
        <div className="export-preview-issues mb-3">
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className={`flex align-items-center gap-2 p-2 border-round mb-1 ${
                issue.severity === 'error'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-yellow-50 text-yellow-700'
              }`}
            >
              <i
                className={
                  issue.severity === 'error'
                    ? 'pi pi-times-circle'
                    : 'pi pi-exclamation-triangle'
                }
              />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      <pre className="export-preview-code">{content}</pre>
    </Dialog>
  );
};
