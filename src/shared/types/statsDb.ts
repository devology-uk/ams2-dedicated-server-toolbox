// src/shared/types/statsDb.ts

// ---- Import result ----

export interface ImportResult {
    serverId: number;
    serverName: string;
    sessionsInFile: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{ sessionIndex: number; error: string }>;
}

// ---- Query return types ----

export interface ServerSummary {
    id: number;
    name: string;
    identifier: string;
    filePath: string | null;
    lastImportedAt: number | null;
    sessionCount: number;
    playerCount: number;
}

export interface PlayerSummary {
    id: number;
    steamId: string;
    name: string;
    firstSeen: number;
    lastSeen: number;
    raceJoins: number;
    raceFinishes: number;
    totalDistance: number;
}

export interface SessionSummary {
    id: number;
    sessionIndex: number;
    startTime: number;
    endTime: number | null;
    finished: boolean;
    trackId: number;
    vehicleModelId: number;
    stageNames: string[];
    participantCount: number;
    hasResults: boolean;
}

export interface StageResultRow {
    id: number;
    stageName: string;
    position: number;
    name: string;
    steamId: string | null;
    fastestLapTime: number | null;
    lapsCompleted: number;
    totalTime: number;
    state: string;
    vehicleId: number;
}

export interface PlayerResultHistory {
    sessionIndex: number;
    sessionStartTime: number;
    stageName: string;
    trackId: number;
    position: number;
    fastestLapTime: number | null;
    lapsCompleted: number;
    totalTime: number;
    state: string;
}

export interface PlayerBestLap {
    trackId: number;
    bestLapTime: number;
    sessionIndex: number;
    stageName: string;
    sessionStartTime: number;
}

export interface ImportLogEntry {
    id: number;
    importedAt: number;
    filePath: string;
    sessionsInFile: number;
    sessionsImported: number;
    sessionsUpdated: number;
    sessionsSkipped: number;
    status: string;
    errorMessage: string | null;
}

export interface ServerOverview {
    totalSessions: number;
    sessionsWithResults: number;
    totalPlayers: number;
    totalStages: Record<string, number>;
    recentSessions: SessionSummary[];
}

// ---- Generic IPC response wrapper ----

export interface IpcResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}