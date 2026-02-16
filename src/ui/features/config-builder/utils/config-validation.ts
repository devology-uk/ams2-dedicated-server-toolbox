// src/ui/features/config-builder/utils/config-validation.ts

import type { ServerConfig } from '../../../../shared/types/config';

export type ValidationSeverity = 'error' | 'warn';

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
}

export type ValidationRule = (config: ServerConfig) => ValidationIssue | null;

// ---------------------------------------------------------------------------
// Rules — add new rules by appending to this array
// ---------------------------------------------------------------------------
const rules: ValidationRule[] = [

  // ServerControlsVehicleClass and ServerControlsVehicle are mutually exclusive
  (config) => {
    const attrs = config.sessionAttributes;
    if (attrs?.ServerControlsVehicleClass && attrs?.ServerControlsVehicle) {
      return {
        severity: 'error',
        message: 'Server Controls Vehicle Class and Server Controls Vehicle cannot both be enabled.',
      };
    }
    return null;
  },

];

// ---------------------------------------------------------------------------
// Run all rules and collect issues
// ---------------------------------------------------------------------------
export function validateConfig(config: ServerConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const rule of rules) {
    const issue = rule(config);
    if (issue) {
      issues.push(issue);
    }
  }
  return issues;
}
