// src/ui/features/api-explorer/export/buildExport.ts

import type { AllListsData, ExportField, ExportLookup } from '../../../../shared/types/index.js';

// Row-building only needs the shape of an export configuration, not a saved
// preset's id/name/format — keeping this narrow lets callers pass either.
export interface ExportSpec {
  primaryEndpoint: string;
  fields: ExportField[];
  lookups: ExportLookup[];
  columnOrder: string[];
}

export interface ExportColumn {
  key: string;
  label: string;
}

export function getAvailableFields(lists: AllListsData, endpoint: string): string[] {
  const rows = lists[endpoint]?.list ?? [];
  const fieldNames = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => fieldNames.add(key)));
  return Array.from(fieldNames).sort();
}

export function lookupColumnKey(lookup: Pick<ExportLookup, 'endpoint'>, field: string): string {
  return `${lookup.endpoint}.${field}`;
}

function naturalColumns(spec: ExportSpec): ExportColumn[] {
  const primaryColumns = spec.fields.map((f) => ({ key: f.field, label: f.alias?.trim() || f.field }));
  const lookupColumns = spec.lookups.flatMap((lookup) =>
    lookup.fields.map((f) => {
      const key = lookupColumnKey(lookup, f.field);
      return { key, label: f.alias?.trim() || key };
    }),
  );
  return [...primaryColumns, ...lookupColumns];
}

// Resolves the final, ordered set of output columns: entries from
// columnOrder first (in that order), then any selected columns not yet
// present in columnOrder (e.g. a field added after the order was set).
export function getExportColumns(spec: ExportSpec): ExportColumn[] {
  const columns = naturalColumns(spec);
  const byKey = new Map(columns.map((column) => [column.key, column]));
  const ordered: ExportColumn[] = [];

  spec.columnOrder.forEach((key) => {
    const column = byKey.get(key);
    if (column) {
      ordered.push(column);
      byKey.delete(key);
    }
  });

  columns.forEach((column) => {
    if (byKey.has(column.key)) ordered.push(column);
  });

  return ordered;
}

export function buildExportRows(lists: AllListsData, spec: ExportSpec): Record<string, unknown>[] {
  const primaryRows = lists[spec.primaryEndpoint]?.list ?? [];

  return primaryRows.map((row) => {
    const output: Record<string, unknown> = {};

    spec.fields.forEach(({ field }) => {
      output[field] = row[field];
    });

    spec.lookups.forEach((lookup) => {
      const relatedRows = lists[lookup.endpoint]?.list ?? [];
      const matches = relatedRows.filter((related) => related[lookup.foreignField] === row[lookup.localField]);

      lookup.fields.forEach(({ field }) => {
        const columnKey = lookupColumnKey(lookup, field);
        if (matches.length === 0) {
          output[columnKey] = null;
        } else if (matches.length === 1) {
          output[columnKey] = matches[0][field];
        } else {
          output[columnKey] = matches.map((match) => match[field]);
        }
      });
    });

    return output;
  });
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

export function rowsToCsv(
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
  includeHeaders: boolean,
): string {
  const dataLines = rows.map((row) => columns.map((column) => escapeCsvValue(row[column.key])).join(','));
  if (!includeHeaders) return dataLines.join('\n');

  const header = columns.map((column) => escapeCsvValue(column.label)).join(',');
  return [header, ...dataLines].join('\n');
}

export function rowsToJson(rows: Record<string, unknown>[], columns: ExportColumn[]): string {
  const renamedRows = rows.map((row) => {
    const output: Record<string, unknown> = {};
    columns.forEach((column) => {
      output[column.label] = row[column.key];
    });
    return output;
  });
  return JSON.stringify(renamedRows, null, 2);
}
