// src/shared/types/ams2EnhancedStats.ts
// Types for the ams2_stats Lua plugin output format.

export interface AMS2EnhancedStatsFile {
    meta: {
        plugin_version: string;
        last_updated?: string;
    };
    sessions: EnhancedSession[];
    current?: Partial<EnhancedSession>;  // in-progress session if server is running
}

export interface EnhancedSession {
    uid: string;               // "YYYYMMDD_HHMMSS"
    stage: string | null;      // e.g. "Race1", "Practice1"
    duration_mins: number | null;
    started_at: string;        // ISO datetime string
    finished_at?: string;
    attrs: Record<string, unknown>;
    drivers: EnhancedDriver[];
    results: EnhancedResult[];
}

export interface EnhancedLap {
    lap: number;
    time: number | null;       // milliseconds
    s1: number | null;
    s2: number | null;
    s3: number | null;
    valid: boolean;
    position: number | null;
}

export interface EnhancedDriver {
    refid: number;
    name: string | null;
    car: string | null;
    team: string | null;
    started: boolean;
    state: string | null;      // "Finished" | "DNF" | null
    final_position: number | null;
    laps: EnhancedLap[];
    best_lap: {
        lap: number | null;
        time: number;
        s1: number | null;
        s2: number | null;
        s3: number | null;
    } | null;
    best_s1: number | null;
    best_s2: number | null;
    best_s3: number | null;
}

export interface EnhancedResult {
    position: number | null;
    refid: number;
    name: string | null;
    car: string | null;
    team: string | null;
    best_lap_time: number | null;
    best_s1: number | null;
    best_s2: number | null;
    best_s3: number | null;
    total_time: number | null;
    laps_complete: number | null;
    state: string | null;
}
