// src/app/db/schema.ts

// We define the schema as plain SQL creation statements rather than
// using Drizzle's migration system, which avoids needing to bundle
// .sql files in the Electron package. Tables use IF NOT EXISTS so
// this is safe to run on every app start.

export const SCHEMA_VERSION = 2;

export const CREATE_TABLES = `
  -- Schema version tracking
  CREATE TABLE IF NOT EXISTS schema_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Servers: each stats file source
  CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    identifier TEXT NOT NULL UNIQUE,
    file_path TEXT,
    last_imported_at INTEGER,
    last_known_history_index INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  -- Players: deduplicated by Steam ID
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    steam_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
  );

  -- Player aggregate stats per server
  CREATE TABLE IF NOT EXISTS player_server_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id),
    server_id INTEGER NOT NULL REFERENCES servers(id),
    race_joins INTEGER DEFAULT 0,
    race_finishes INTEGER DEFAULT 0,
    race_loads INTEGER DEFAULT 0,
    last_joined INTEGER,
    UNIQUE(player_id, server_id)
  );

  -- Sessions: one per history entry per server
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL REFERENCES servers(id),
    session_index INTEGER NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    finished INTEGER NOT NULL DEFAULT 0,
    track_id INTEGER NOT NULL,
    vehicle_model_id INTEGER NOT NULL,
    vehicle_class_id INTEGER,
    setup_json TEXT,
    imported_at INTEGER NOT NULL,
    updated_at INTEGER,
    content_hash TEXT NOT NULL,
    UNIQUE(server_id, session_index)
  );

  -- Session participants
  CREATE TABLE IF NOT EXISTS session_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    participant_index INTEGER NOT NULL,
    player_id INTEGER REFERENCES players(id),
    steam_id TEXT NOT NULL,
    name TEXT NOT NULL,
    vehicle_id INTEGER NOT NULL,
    livery_id INTEGER NOT NULL,
    ref_id INTEGER NOT NULL,
    is_player INTEGER NOT NULL DEFAULT 1
  );

  -- Session members (join/leave tracking)
  CREATE TABLE IF NOT EXISTS session_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL,
    player_id INTEGER REFERENCES players(id),
    steam_id TEXT NOT NULL,
    name TEXT NOT NULL,
    join_time INTEGER NOT NULL,
    leave_time INTEGER,
    participant_id INTEGER,
    vehicle_id INTEGER NOT NULL,
    livery_id INTEGER NOT NULL
  );

  -- Stages (practice1, qualifying1, race1, etc.)
  CREATE TABLE IF NOT EXISTS stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    UNIQUE(session_id, name)
  );

  -- Stage results
  CREATE TABLE IF NOT EXISTS stage_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_id INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES players(id),
    steam_id TEXT,
    name TEXT NOT NULL,
    participant_id INTEGER NOT NULL,
    ref_id INTEGER NOT NULL,
    is_player INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL,
    fastest_lap_time INTEGER,
    laps_completed INTEGER NOT NULL,
    total_time INTEGER NOT NULL,
    state TEXT NOT NULL,
    vehicle_id INTEGER NOT NULL,
    recorded_at INTEGER NOT NULL,
    is_manual INTEGER NOT NULL DEFAULT 0
  );

  -- Player distance tracking per server/track/vehicle
  CREATE TABLE IF NOT EXISTS player_distances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id),
    server_id INTEGER NOT NULL REFERENCES servers(id),
    track_id INTEGER NOT NULL,
    distance REAL NOT NULL,
    UNIQUE(player_id, server_id, track_id)
  );

  -- Import audit log
  CREATE TABLE IF NOT EXISTS import_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL REFERENCES servers(id),
    imported_at INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    sessions_in_file INTEGER NOT NULL,
    sessions_imported INTEGER NOT NULL,
    sessions_updated INTEGER NOT NULL,
    sessions_skipped INTEGER NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT
  );

  -- Indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_sessions_server ON sessions(server_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions(track_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time);
  CREATE INDEX IF NOT EXISTS idx_stage_results_stage ON stage_results(stage_id);
  CREATE INDEX IF NOT EXISTS idx_stage_results_session ON stage_results(session_id);
  CREATE INDEX IF NOT EXISTS idx_stage_results_player ON stage_results(player_id);
  CREATE INDEX IF NOT EXISTS idx_stage_results_steam ON stage_results(steam_id);
  CREATE INDEX IF NOT EXISTS idx_session_members_session ON session_members(session_id);
  CREATE INDEX IF NOT EXISTS idx_session_members_steam ON session_members(steam_id);
  CREATE INDEX IF NOT EXISTS idx_players_steam ON players(steam_id);
`;