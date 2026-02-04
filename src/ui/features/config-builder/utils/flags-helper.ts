import type { FlagItem } from '../types/config-builder.types';

/**
 * Parse a combined flag value into individual selected flags
 */
export function parseFlagValue(
  combinedValue: number,
  availableFlags: FlagItem[]
): number[] {
  const selectedValues: number[] = [];

  for (const flag of availableFlags) {
    // Handle the sign bit case (negative value like -2147483648)
    if (flag.value < 0) {
      // Check if the sign bit is set
      if (combinedValue < 0 || (combinedValue & 0x80000000) !== 0) {
        // Need more careful check for this specific flag
        if ((combinedValue & flag.value) === flag.value) {
          selectedValues.push(flag.value);
        }
      }
    } else {
      // Normal positive flag - check with bitwise AND
      if ((combinedValue & flag.value) === flag.value) {
        selectedValues.push(flag.value);
      }
    }
  }

  return selectedValues;
}

/**
 * Combine selected flag values into a single bitfield value
 */
export function combineFlagValues(selectedValues: number[]): number {
  let combined = 0;

  for (const value of selectedValues) {
    combined |= value;
  }

  // Handle potential overflow to signed int32
  return combined | 0; // Force to signed 32-bit int
}

/**
 * Toggle a flag in a combined value
 */
export function toggleFlag(
  currentCombined: number,
  flagValue: number,
  enabled: boolean
): number {
  if (enabled) {
    return (currentCombined | flagValue) | 0;
  } else {
    return (currentCombined & ~flagValue) | 0;
  }
}

/**
 * Check if a specific flag is set in a combined value
 */
export function isFlagSet(combinedValue: number, flagValue: number): boolean {
  if (flagValue < 0) {
    // Handle sign bit
    return (combinedValue & flagValue) === flagValue;
  }
  return (combinedValue & flagValue) === flagValue;
}