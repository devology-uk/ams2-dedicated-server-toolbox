import type {
  AttributeDefinition,
  ApiDataType,
  FieldMetadata,
  FieldType,
  EnumEndpointName,
  FlagEndpointName,
} from '../../../../shared/types/config';

// ============================================
// Description Parsing
// ============================================

interface ParsedDescription {
  enumEndpoint?: EnumEndpointName;
  flagsEndpoint?: FlagEndpointName;
  min?: number;
  max?: number;
  step?: number;
  isBooleanLike?: boolean;
  booleanLabels?: { off: string; on: string };
}

const KNOWN_BOOLEAN_FIELDS: Set<string> = new Set([
  'ServerControlsSetup',
  'ServerControlsTrack',
  'ServerControlsVehicleClass',
  'ServerControlsVehicle',
  'AutoAdvanceSession',
  'ManualRollingStarts',
  'PitWhiteLinePenalty',
  'DriveThroughPenalty',
  'FullCourseYellows',
  'QualifyPrivateSession',
  'RaceExtraLap',
  'RaceRollingStart',
  'RaceMandatoryPitStops',
  'RaceFormationLap',
  'DisablePitstopRefuelling',
  // Add any others you identify
]);

/**
 * Parse attribute description to extract metadata hints
 */
function parseDescription(_name: string, description: string): ParsedDescription {
  const result: ParsedDescription = {};

  // Check for enum endpoint reference
  // Pattern: "/api/list/enums/damage" or "lists.enums.damage"
  const enumMatch = description.match(/\/api\/list\/enums\/(\w+)/);
  if (enumMatch) {
    result.enumEndpoint = enumMatch[1] as EnumEndpointName;
  }

  // Check for flags endpoint reference
  // Pattern: "/api/list/flags/session" or "lists.flags.session"
  const flagsMatch = description.match(/\/api\/list\/flags\/(\w+)/);
  if (flagsMatch) {
    result.flagsEndpoint = flagsMatch[1] as FlagEndpointName;
  }

  // Check for range pattern: "range X-Y", "range from X to Y", "between X and Y", or bare "X-Y" at end
  const rangeMatch = description.match(/range\s+(\d+)\s*[-–]\s*(\d+)/i)
    ?? description.match(/range\s+from\s+(\d+)\s+to\s+(\d+)/i)
    ?? description.match(/between\s+(\d+)\s+and\s+(\d+)/i)
    ?? description.match(/\b(\d+)\s*[-–]\s*(\d+)\s*$/);
  if (rangeMatch) {
    result.min = parseInt(rangeMatch[1], 10);
    result.max = parseInt(rangeMatch[2], 10);
  }

  // Check for step pattern: "in steps of N" or "steps of N"
  const stepMatch = description.match(/(?:in\s+)?steps?\s+of\s+(\d+)/i);
  if (stepMatch) {
    result.step = parseInt(stepMatch[1], 10);
  }

  // Check for boolean-like pattern: "(0) disabled (1) enabled" or similar
  const booleanMatch = description.match(/$0$\s*(\w+(?:\s+\w+)?)\s*$1$\s*(\w+(?:\s+\w+)?)/i);
  if (booleanMatch) {
    result.isBooleanLike = true;
    result.booleanLabels = {
      off: booleanMatch[1].trim(),
      on: booleanMatch[2].trim(),
    };
  }

  return result;
}

/**
 * Convert internal name to human-readable label
 * e.g., "ServerControlsTrack" -> "Server Controls Track"
 * e.g., "FORCE_IDENTICAL_VEHICLES" -> "Force Identical Vehicles"
 */
export function formatLabel(name: string): string {
  // Handle SCREAMING_SNAKE_CASE
  if (name.includes('_') && name === name.toUpperCase()) {
    return name
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Handle PascalCase or camelCase
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

/**
 * Determine the best field type based on attribute metadata
 */
function determineFieldType(
  name: string,
  dataType: ApiDataType,
  parsed: ParsedDescription,
  isReadOnly: boolean,
): FieldType {
  if (isReadOnly) {
    return 'readonly';
  }

  // Special ID fields by name
  if (name === 'TrackId') return 'track';
  if (name === 'VehicleModelId') return 'vehicle';
  if (name === 'VehicleClassId') return 'vehicleClass';
  if (name.match(/WeatherSlot\d+$/)) return 'weather';
  if (name.match(/MultiClassSlot\d+$/)) return 'vehicleClass';
  if (name === 'PracticeLiveTrackPreset' || name === 'QualifyLiveTrackPreset' || name === 'RaceLiveTrackPreset') return 'dropdown';
  if (name.endsWith('DateHour')) return 'hour';
  if (name.endsWith('DateMonth')) return 'month';
  if (name.endsWith('DateYear')) return 'year';

  // Known boolean fields
  if (KNOWN_BOOLEAN_FIELDS.has(name)) return 'switch';

  // Enum reference in description
  if (parsed.enumEndpoint) return 'dropdown';

  // Flags reference in description
  if (parsed.flagsEndpoint) return 'flags';

  // Boolean-like pattern in description
  if (parsed.isBooleanLike) return 'switch';

  // Numeric with small range - use slider
  if (parsed.min !== undefined && parsed.max !== undefined) {
    const range = parsed.max - parsed.min;
    if (range <= 100) {
      return 'slider';
    }
    return 'number';
  }

  // Default based on data type
  if (dataType === 'string') return 'text';
  if (dataType === 'boolean') return 'switch';
  if (dataType.includes('int') || dataType === 'float' || dataType === 'double') {
    return 'number';
  }

  return 'text';
}

/**
 * Categorize a field based on its name
 */
function categorizeField(name: string): string {
  // Server control fields
  if (name.startsWith('ServerControls')) {
    return 'Server Control';
  }

  // Weather fields
  if (name.includes('Weather')) {
    return 'Weather';
  }

  // Session length/timing
  if (name.includes('Length') || name.includes('Date') || name.includes('Hour')) {
    return 'Session Timing';
  }

  // Grid/Players
  if (name.includes('Grid') || name.includes('Player') || name.includes('MaxPlayers')) {
    return 'Grid & Players';
  }

  // Vehicle/Track
  if (
    name.includes('Track') ||
    name.includes('Vehicle') ||
    name === 'TrackId' ||
    name === 'VehicleModelId' ||
    name === 'VehicleClassId'
  ) {
    return 'Track & Vehicle';
  }

  // Game rules
  if (
    name.includes('Damage') ||
    name.includes('Tire') ||
    name.includes('Fuel') ||
    name.includes('Penalties') ||
    name.includes('Difficulty') ||
    name.includes('Allowed')
  ) {
    return 'Realism & Difficulty';
  }

  // Flags
  if (name === 'Flags') {
    return 'Session Flags';
  }

  return 'General';
}

// ============================================
// Main Schema Processor
// ============================================

/**
 * Process raw attribute definitions into form field metadata
 */
export function processAttributeSchema(attributes: AttributeDefinition[]): FieldMetadata[] {
  return attributes.map((attr) => {
    const parsed = parseDescription(attr.name, attr.description);
    const isReadOnly = attr.access === 'ReadOnly';
    const fieldType = determineFieldType(attr.name, attr.type, parsed, isReadOnly);

    const metadata: FieldMetadata = {
      name: attr.name,
      label: formatLabel(attr.name),
      description: attr.description,
      fieldType,
      dataType: attr.type,
      isReadOnly,
      category: categorizeField(attr.name),
    };

    // Override enum endpoint for LiveTrackPreset fields (description is incorrect/missing)
    if (attr.name === 'PracticeLiveTrackPreset' || attr.name === 'QualifyLiveTrackPreset' || attr.name === 'RaceLiveTrackPreset') {
      metadata.enumEndpoint = 'livetrack_preset';
    } else if (parsed.enumEndpoint) {
      metadata.enumEndpoint = parsed.enumEndpoint;
    }

    // Add flags endpoint if detected
    if (parsed.flagsEndpoint) {
      metadata.flagsEndpoint = parsed.flagsEndpoint;
    }

    // Add range if detected
    if (parsed.min !== undefined) {
      metadata.min = parsed.min;
    }
    if (parsed.max !== undefined) {
      metadata.max = parsed.max;
    }

    // Name-based range overrides for date part fields
    if (attr.name.endsWith('DateDay')) {
      metadata.min = 1;
      metadata.max = 31;
    }
    if (attr.name.endsWith('DateYear')) {
      const currentYear = new Date().getFullYear();
      metadata.min = currentYear - 10;
      metadata.max = currentYear + 5;
    }

    // Name-based range overrides for fields whose description range excludes 0 but 0 is a valid sentinel
    if (attr.name === 'AllowedCutsBeforePenalty') {
      metadata.min = 0;
      metadata.max = 50;
    }
    if (attr.name === 'PracticeWeatherSlots' || attr.name === 'QualifyWeatherSlots' || attr.name === 'RaceWeatherSlots') {
      metadata.min = 0;
      metadata.max = 4;
    }
    if (attr.name === 'MultiClassSlots') {
      metadata.min = 0;
      metadata.max = 3;
    }

    // Add boolean labels if detected
    if (parsed.booleanLabels) {
      metadata.booleanLabels = parsed.booleanLabels;
    }

    // Add step if detected
    if (parsed.step !== undefined) {
      metadata.step = parsed.step;
    }

    // Static options for Privacy field
    if (attr.name === 'Privacy') {
      metadata.fieldType = 'dropdown';
      metadata.staticOptions = [
        { value: 0, name: 'Public' },
        { value: 1, name: 'Friends Only' },
        { value: 2, name: 'Private' },
      ];
    }

    return metadata;
  });
}

/**
 * Group fields by category
 */
export function groupFieldsByCategory(fields: FieldMetadata[]): Map<string, FieldMetadata[]> {
  const groups = new Map<string, FieldMetadata[]>();

  // Define category order
  const categoryOrder = [
    'Server Control',
    'Track & Vehicle',
    'Grid & Players',
    'Session Timing',
    'Realism & Difficulty',
    'Weather',
    'Session Flags',
    'General',
  ];

  // Initialize groups in order
  for (const category of categoryOrder) {
    groups.set(category, []);
  }

  // Distribute fields into groups
  for (const field of fields) {
    const category = field.category || 'General';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(field);
  }

  // Remove empty groups
  for (const [key, value] of groups) {
    if (value.length === 0) {
      groups.delete(key);
    }
  }

  return groups;
}

/**
 * Get icon for a category (PrimeIcons)
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Server Control': 'pi pi-server',
    'Track & Vehicle': 'pi pi-car',
    'Grid & Players': 'pi pi-users',
    'Session Timing': 'pi pi-clock',
    'Realism & Difficulty': 'pi pi-sliders-h',
    'Weather': 'pi pi-cloud',
    'Session Flags': 'pi pi-flag',
    'General': 'pi pi-cog',
  };
  return icons[category] || 'pi pi-cog';
}
