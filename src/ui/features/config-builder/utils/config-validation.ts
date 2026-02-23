// src/ui/features/config-builder/utils/config-validation.ts

import type { ServerConfig } from '../../../../shared/types/config';

// Session flag bit values (stable AMS2 game constants)
const FLAG_FORCE_IDENTICAL_VEHICLES  = 2;
const FLAG_FORCE_SAME_VEHICLE_CLASS  = 512;
const FLAG_FORCE_MULTI_VEHICLE_CLASS = 1024;

function isFlagSet(flags: number | undefined, flag: number): boolean {
  return !!flags && (flags & flag) !== 0;
}

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

  // MaxPlayers cannot exceed GridSize
  (config) => {
    const attrs = config.sessionAttributes;
    const max = attrs?.MaxPlayers;
    const grid = attrs?.GridSize;
    if (max != null && grid != null && max > grid) {
      return {
        severity: 'error',
        message: `Max Players (${max}) cannot be higher than Grid Size (${grid}).`,
      };
    }
    return null;
  },

  // RaceFormationLap is only valid when RaceRollingStart is enabled
  (config) => {
    const attrs = config.sessionAttributes;
    if (attrs?.RaceFormationLap && !attrs?.RaceRollingStart) {
      return {
        severity: 'error',
        message: 'Race Formation Lap is only valid when Race Rolling Start is enabled.',
      };
    }
    return null;
  },

  // ServerControlsVehicle enabled but no VehicleModelId specified
  (config) => {
    const attrs = config.sessionAttributes;
    if (attrs?.ServerControlsVehicle && !attrs?.VehicleModelId) {
      return {
        severity: 'warn',
        message: 'Server Controls Vehicle is enabled but no Vehicle Model has been selected.',
      };
    }
    return null;
  },

  // ServerControlsVehicleClass enabled but no VehicleClassId specified
  (config) => {
    const attrs = config.sessionAttributes;
    if (attrs?.ServerControlsVehicleClass && !attrs?.VehicleClassId) {
      return {
        severity: 'warn',
        message: 'Server Controls Vehicle Class is enabled but no Vehicle Class has been selected.',
      };
    }
    return null;
  },

  // MultiClassSlots configured but ServerControlsVehicleClass not enabled
  (config) => {
    const attrs = config.sessionAttributes;
    if (attrs?.MultiClassSlots && attrs.MultiClassSlots > 0 && !attrs?.ServerControlsVehicleClass) {
      return {
        severity: 'warn',
        message: 'Multi-class slots are configured but Server Controls Vehicle Class is not enabled.',
      };
    }
    return null;
  },

  // ServerControlsVehicle enabled but FORCE_IDENTICAL_VEHICLES flag not set
  (config) => {
    const attrs = config.sessionAttributes;
    if (attrs?.ServerControlsVehicle && !isFlagSet(attrs.Flags, FLAG_FORCE_IDENTICAL_VEHICLES)) {
      return {
        severity: 'warn',
        message: 'Server Controls Vehicle is enabled but the FORCE_IDENTICAL_VEHICLES session flag is not set.',
      };
    }
    return null;
  },

  // ServerControlsVehicleClass enabled but neither FORCE_SAME_VEHICLE_CLASS nor FORCE_MULTI_VEHICLE_CLASS flag is set
  (config) => {
    const attrs = config.sessionAttributes;
    if (
      attrs?.ServerControlsVehicleClass &&
      !isFlagSet(attrs.Flags, FLAG_FORCE_SAME_VEHICLE_CLASS) &&
      !isFlagSet(attrs.Flags, FLAG_FORCE_MULTI_VEHICLE_CLASS)
    ) {
      return {
        severity: 'warn',
        message: 'Server Controls Vehicle Class is enabled but neither FORCE_SAME_VEHICLE_CLASS nor FORCE_MULTI_VEHICLE_CLASS session flag is set.',
      };
    }
    return null;
  },

  // FORCE_MULTI_VEHICLE_CLASS flag set but MultiClassSlots not configured
  (config) => {
    const attrs = config.sessionAttributes;
    if (isFlagSet(attrs?.Flags, FLAG_FORCE_MULTI_VEHICLE_CLASS) && !(attrs?.MultiClassSlots && attrs.MultiClassSlots > 0)) {
      return {
        severity: 'warn',
        message: 'FORCE_MULTI_VEHICLE_CLASS flag is set but no Multi-class slots are configured.',
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
