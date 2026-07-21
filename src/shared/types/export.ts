// src/shared/types/export.ts

// ============================================
// API Explorer export presets
// ============================================

export interface ExportField {
  field: string;
  alias?: string;
}

export interface ExportLookup {
  endpoint: string;
  localField: string;
  foreignField: string;
  fields: ExportField[];
}

export interface ExportPreset {
  id: string;
  name: string;
  primaryEndpoint: string;
  fields: ExportField[];
  lookups: ExportLookup[];
  // Ordered list of internal column keys (field name for primary columns,
  // "endpoint.field" for lookup columns) controlling CSV/JSON column order.
  // Columns not listed here are appended in their natural order.
  columnOrder: string[];
  includeHeaders: boolean;
  format: 'json' | 'csv';
}

export type ExportPresetInput = Omit<ExportPreset, 'id'> & { id?: string };
