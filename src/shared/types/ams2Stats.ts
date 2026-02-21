// src/shared/types/ams2Stats.ts

// === Top-level file structure ===

export interface AMS2StatsFile {
    next_history_index: number;
    stats: {
        history: SessionHistory[];
        players: Record<string, PlayerStats>;
        server: ServerStats;
        session: SessionStats;
    };
}

// === Server ===

export interface ServerStats {
    name: string;
    steam_disconnects: number;
    steam_downtime: number;
    total_steam_downtime: number;
    total_uptime: string;
    uptime: string;
}

// === Session aggregate stats ===

export interface SessionStats {
    counts: {
        lobbies: number;
        player_finishes: number;
        player_loads: number;
        player_loads_done: number;
        race_finishes: number;
        race_loads: number;
        race_loads_done: number;
        sessions: number;
        stage_counts: Record<string, number>;
        stage_durations: Record<string, number | string>;
        track_distances: Record<string, number | string>;
        tracks: Record<string, number>;
        vehicle_distances: Record<string, number | string>;
        vehicles: Record<string, number>;
    };
}

// === Player stats ===

export interface PlayerPositionStats {
    positions: Record<string, number>;
    positions_per_size: Record<string, number>;
    states: Record<string, number>;
}

export interface PlayerStats {
    counts: {
        qualify: PlayerPositionStats;
        race: PlayerPositionStats;
        race_finishes: number;
        race_joins: number;
        race_loads: number;
        race_loads_done: number;
        track_distances: Record<string, number | string>;
        tracks: Record<string, number>;
        vehicle_distances: Record<string, number | string>;
        vehicles: Record<string, number>;
    };
    last_joined: number;
    name: string;
}

// === Session history ===

export interface SessionHistory {
    end_time: number;
    finished: boolean;
    index: number;
    members: Record<string, Member>;
    participants: Participant[] | Record<string, Participant>;
    setup: SessionSetup;
    stages: Record<string, Stage>;
    start_time: number;
}

// === Participant ===

export interface Participant {
    IsPlayer: number;
    LiveryId: number;
    Name: string;
    RefId: number;
    SteamID: string;
    VehicleId: number;
}

// === Member (join/leave tracking) ===

export interface MemberSetup {
    LiveryId: number;
    RaceStatFlags: number;
    VehicleId: number;
}

export interface Member {
    index: number;
    join_time: number;
    leave_time: number; // -1 = still connected
    name: string;
    participantid: number; // -1 = spectator / unassigned
    setup: MemberSetup;
    steamid: string;
}

// === Stage ===

export interface Stage {
    end_time: number;
    events: Record<string, unknown>;
    results: StageResult[] | Record<string, never>;
    start_time: number;
}

// === Stage Results ===

export interface StageResultAttributes {
    FastestLapTime: number; // milliseconds (0 = no valid lap)
    Lap: number; // laps completed
    RacePosition: number; // finishing position
    State: string; // "Finished", "DNF", "Retired", etc.
    TotalTime: number; // milliseconds
    VehicleId: number;
}

export interface StageResult {
    attributes: StageResultAttributes;
    is_player: boolean;
    name: string;
    participantid: number;
    refid: number;
    time: number; // unix timestamp when result was recorded
}

// === Session Setup ===

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

// === Convenience / Parsed types for the UI ===

export type StageType = 'practice1' | 'qualifying1' | 'race1' | string;

export interface ParsedResult {
    position: number;
    name: string;
    steamId: string | null;
    fastestLap: number; // milliseconds
    fastestLapFormatted: string;
    lapsCompleted: number;
    totalTime: number; // milliseconds
    totalTimeFormatted: string;
    state: string;
    vehicleId: number;
    isPlayer: boolean;
    participantId: number;
    refId: number;
    recordedAt: Date;
}

export interface ParsedMember {
    id: string; // the arbitrary key from the members dict
    name: string;
    steamId: string;
    joinTime: Date;
    leaveTime: Date | null; // null = still connected
    sessionDuration: number; // seconds spent in session
    participantId: number;
    isSpectator: boolean;
    setup: MemberSetup;
}

export interface StageOverview {
    stageName: string;
    stageType: StageType;
    startTime: Date;
    endTime: Date | null;
    duration: number; // seconds
    resultCount: number;
    hasResults: boolean;
}

export interface PlayerQualifyingStats {
    steamId: string;
    name: string;
    appearances: number;
    poles: number;             // times qualified in P1
    bestPosition: number;      // best grid pos achieved; 0 = none
    avgPosition: number;
}

export interface PlayerRaceStats {
    steamId: string;
    name: string;
    appearances: number;       // total race entries (finished + DNF)
    wins: number;
    podiums: number;           // position <= 3, State === 'Finished'
    finishes: number;          // State === 'Finished'
    dnfs: number;
    bestPosition: number;      // best finishing position; 0 = no finish
    avgPosition: number;       // average of finished positions only
}

export interface PlayerEventStats {
    steamId: string;
    name: string;
    qualifying: PlayerQualifyingStats | null;
    race: PlayerRaceStats | null;
}

export interface EventOverviewStats {
    totalEvents: number;
    qualifyingCount: number;   // events with qualifying1 results
    raceCount: number;         // events with race1 results
    uniqueDrivers: number;     // distinct steamIds across all event results
    trackUsage: Array<{
        trackId: number;
        qualifyingCount: number;
        raceCount: number;
    }>;
}