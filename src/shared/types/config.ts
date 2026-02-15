// src/ui/features/config-builder/types/config-builder.types.ts

// ============================================
// API Data Types
// ============================================
export type ApiDataType =
  | 'int8'
  | 'int16'
  | 'int32'
  | 'int64'
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'uint64'
  | 'float'
  | 'double'
  | 'string'
  | 'boolean';

// ============================================
// Attribute Definitions (from API schema)
// ============================================
export interface AttributeDefinition {
  name: string;
  type: ApiDataType;
  access: 'ReadWrite' | 'ReadOnly';
  description: string;
}

// ============================================
// Enums & Flags
// ============================================
export interface EnumItem {
  value: number;
  name: string;
}

export interface FlagItem {
  value: number;
  name: string;
}

// ============================================
// Endpoint Names
// ============================================
export type EnumEndpointName =
  | 'damage'
  | 'damage_scale'
  | 'random_failures'
  | 'tire_wear'
  | 'fuel_usage'
  | 'penalties'
  | 'game_mode'
  | 'allowed_view'
  | 'weather'
  | 'grid_positions'
  | 'pit_control'
  | 'online_rep'
  | 'livetrack_preset'
  | 'scheduledfcy';

export type FlagEndpointName = 'session' | 'player';

// ============================================
// Field Metadata (for dynamic form rendering)
// ============================================
export type FieldType =
  | 'text'
  | 'number'
  | 'slider'
  | 'switch'
  | 'dropdown'
  | 'flags'
  | 'track'
  | 'vehicle'
  | 'vehicleClass'
  | 'weather'
  | 'readonly';

export interface FieldMetadata {
  name: string;
  label: string;
  description: string;
  fieldType: FieldType;
  dataType: ApiDataType;
  isReadOnly: boolean;
  enumEndpoint?: EnumEndpointName;
  flagsEndpoint?: FlagEndpointName;
  min?: number;
  max?: number;
  booleanLabels?: {
    off: string;
    on: string;
  };
  category?: string;
}

// ============================================
// Resolved Field (with loaded options)
// ============================================
export interface ResolvedField extends FieldMetadata {
  enumOptions?: EnumItem[];
  flagOptions?: FlagItem[];
}

// ============================================
// Field Groups
// ============================================
export interface FieldGroup {
  id: string;
  label: string;
  icon: string;
  fields: ResolvedField[];
}

// ============================================
// HTTP API Access Filter
// ============================================
export interface HttpApiAccessFilter {
  type: 'accept' | 'reject' | 'ip-accept' | 'ip-reject' | 'user' | 'group' | 'reject-password';
  ip?: string;
  user?: string;
  group?: string;
}

// ============================================
// Session Attributes
// ============================================
export interface SessionAttributes {
  ServerControlsSetup?: number;
  ServerControlsTrack?: number;
  ServerControlsVehicleClass?: number;
  ServerControlsVehicle?: number;
  GridSize?: number;
  GridLayout?: number;
  MaxPlayers?: number;
  OpponentDifficulty?: number;
  Flags?: number;
  Privacy?: number;
  AutoAdvanceSession?: number;
  DamageType?: number;
  TireWearType?: number;
  FuelUsageType?: number;
  PenaltiesType?: number;
  AllowedViews?: number;
  TrackId?: number;
  VehicleModelId?: number;
  VehicleClassId?: number;
  PracticeLength?: number;
  QualifyLength?: number;
  RaceLength?: number;
  RaceDateHour?: number;
  PracticeWeatherSlots?: number;
  PracticeWeatherSlot1?: number;
  PracticeWeatherSlot2?: number;
  PracticeWeatherSlot3?: number;
  PracticeWeatherSlot4?: number;
  PracticeWeatherProgression?: number;
  QualifyWeatherSlots?: number;
  QualifyWeatherSlot1?: number;
  QualifyWeatherSlot2?: number;
  QualifyWeatherSlot3?: number;
  QualifyWeatherSlot4?: number;
  QualifyWeatherProgression?: number;
  RaceWeatherSlots?: number;
  RaceWeatherSlot1?: number;
  RaceWeatherSlot2?: number;
  RaceWeatherSlot3?: number;
  RaceWeatherSlot4?: number;
  RaceWeatherProgression?: number;
  [key: string]: number | undefined;
}

// ============================================
// Server Config (root level)
// ============================================
export interface ServerConfig {
  logLevel?: 'debug' | 'info' | 'warning' | 'error';
  eventsLogSize?: number;
  name?: string;
  secure?: boolean;
  password?: string;
  maxPlayerCount?: number;
  bindIP?: string;
  steamPort?: number;
  hostPort?: number;
  queryPort?: number;
  sleepWaiting?: number;
  sleepActive?: number;
  sportsPlay?: boolean;
  allowEmptyJoin?: boolean;
  controlGameSetup?: boolean;
  enableHttpApi?: boolean;
  httpApiLogLevel?: 'debug' | 'info' | 'warning' | 'error';
  httpApiInterface?: string;
  httpApiPort?: number;
  httpApiExtraHeaders?: Record<string, string>;
  httpApiAccessLevels?: Record<string, string>;
  httpApiAccessFilters?: Record<string, HttpApiAccessFilter[]>;
  httpApiUsers?: Record<string, string>;
  httpApiGroups?: Record<string, string[]>;
  staticWebFiles?: string;
  enableLuaApi?: boolean;
  luaAddonRoot?: string;
  luaConfigRoot?: string;
  luaOutputRoot?: string;
  luaApiAddons?: string[];
  luaAllowedLibraries?: string[];
  blackList?: Array<string | number>;
  whiteList?: Record<string, string | number> | Array<string | number>;
  sessionAttributes?: SessionAttributes;
  // Allow extra/unknown keys from parsed configs (e.g. "//" dummy comment entries)
  [key: string]: unknown;
}