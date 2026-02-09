export interface AMS2StatsFile {
  next_history_index: number;
  stats: AMS2Stats;
}

export interface AMS2Stats {
  history: SessionHistory[];
  players: Record<string, PlayerStats>;
  server: ServerInfo;
  session: SessionInfo;
}

// --- Session History ---
export interface SessionHistory {
  end_time: number;
  finished: boolean;
  index: number;
  members: Record<string, unknown>;
  participants: Record<string, Participant> | Participant[];
  setup: SessionSetup;
  stages: Record<string, StageInfo>;
  start_time: number;
}

export interface Participant {
  IsPlayer: number;
  LiveryId: number;
  Name: string;
  RefId: number;
  SteamID: string;
  VehicleId: number;
}

export interface StageInfo {
  end_time: number;
  events: Record<string, unknown>;
  results: Record<string, unknown>;
  start_time: number;
}

export interface SessionSetup {
  AllowedCutsBeforePenalty: number;
  AllowedViews: number;
  AutoAdvanceSession: number;
  DamageRandomFailures: number;
  DamageScale: number;
  DamageType: number;
  DisablePitstopRefuelling: number;
  DriveThroughPenalty: number;
  Flags: number;
  FuelUsageType: number;
  FullCourseYellows: number;
  GridLayout: number;
  GridSize: number;
  ManualPitStops: number;
  ManualRollingStarts: number;
  MaxPlayers: number;
  MinimumOnlineRank: number;
  MinimumOnlineStrength: number;
  MultiClassSlot1: number;
  MultiClassSlot2: number;
  MultiClassSlot3: number;
  MultiClassSlot4: number;
  MultiClassSlot5: number;
  MultiClassSlot6: number;
  MultiClassSlot7: number;
  MultiClassSlot8: number;
  MultiClassSlot9: number;
  MultiClassSlots: number;
  OpponentDifficulty: number;
  PenaltiesType: number;
  PitSpeedLimit: number;
  PitWhiteLinePenalty: number;
  PracticeDateHour: number;
  PracticeDateProgression: number;
  PracticeLength: number;
  PracticeLiveTrackPreset: number;
  PracticeWeatherProgression: number;
  PracticeWeatherSlot1: number;
  PracticeWeatherSlot2: number;
  PracticeWeatherSlot3: number;
  PracticeWeatherSlot4: number;
  PracticeWeatherSlots: number;
  QualifyDateHour: number;
  QualifyDateProgression: number;
  QualifyLength: number;
  QualifyLiveTrackPreset: number;
  QualifyPrivateSession: number;
  QualifyWeatherProgression: number;
  QualifyWeatherSlot1: number;
  QualifyWeatherSlot2: number;
  QualifyWeatherSlot3: number;
  QualifyWeatherSlot4: number;
  QualifyWeatherSlots: number;
  RaceDateDay: number;
  RaceDateHour: number;
  RaceDateMonth: number;
  RaceDateProgression: number;
  RaceDateYear: number;
  RaceExtraLap: number;
  RaceFormationLap: number;
  RaceLength: number;
  RaceLiveTrackPreset: number;
  RaceMandatoryPitStops: number;
  RaceMandatoryPitStopsMinTyres: number;
  RaceRollingStart: number;
  RaceScheduledFullCourseYellow: number;
  RaceWeatherProgression: number;
  RaceWeatherSlot1: number;
  RaceWeatherSlot2: number;
  RaceWeatherSlot3: number;
  RaceWeatherSlot4: number;
  RaceWeatherSlots: number;
  ServerControlsSetup: number;
  ServerControlsTrack: number;
  ServerControlsVehicle: number;
  ServerControlsVehicleClass: number;
  TireWearType: number;
  TrackId: number;
  VehicleClassId: number;
  VehicleModelId: number;
}

// --- Player Stats ---
export interface PlayerStats {
  counts: PlayerCounts;
  last_joined: number;
  name: string;
}

export interface PlayerCounts {
  qualify: PositionCounts;
  race: PositionCounts;
  race_finishes: number;
  race_joins: number;
  race_loads: number;
  race_loads_done: number;
  track_distances: Record<string, number>;
  tracks: Record<string, number>;
  vehicle_distances: Record<string, number>;
  vehicles: Record<string, number>;
}

export interface PositionCounts {
  positions: Record<string, number>;
  positions_per_size: Record<string, Record<string, number>>;
  states: Record<string, number>;
}

// --- Server Info ---
export interface ServerInfo {
  name: string;
  steam_disconnects: number;
  steam_downtime: number;
  total_steam_downtime: number;
  total_uptime: string;
  uptime: string;
}

// --- Session Info ---
export interface SessionInfo {
  counts: SessionCounts;
}

export interface SessionCounts {
  lobbies: number;
  player_finishes: number;
  player_loads: number;
  player_loads_done: number;
  race_finishes: number;
  race_loads: number;
  race_loads_done: number;
  sessions: number;
  stage_counts: Record<string, number>;
  stage_durations: Record<string, number>;
  track_distances: Record<string, number>;
  tracks: Record<string, number>;
  vehicle_distances: Record<string, number>;
  vehicles: Record<string, number>;
}