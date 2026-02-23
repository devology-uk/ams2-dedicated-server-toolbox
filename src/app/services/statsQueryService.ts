// src/app/services/statsQueryService.ts

import type { AppDatabase } from '../db/index.js';

import type {
    ServerSummary,
    PlayerSummary,
    SessionSummary,
    StageResultRow,
    PlayerResultHistory,
    PlayerBestLap,
    ImportLogEntry,
    ServerOverview,
    InsertManualResultParams,
} from '../../shared/types/statsDb.js';

export class StatsQueryService {
    private db: AppDatabase;

    constructor(db: AppDatabase) {
        this.db = db;
    }

    // --------------------------------------------------
    // Servers
    // --------------------------------------------------

    getServers(): ServerSummary[] {
        return this.db
                   .prepare(
                       `SELECT
          s.id, s.name, s.identifier, s.file_path as filePath,
          s.last_imported_at as lastImportedAt,
          (SELECT COUNT(*) FROM sessions WHERE server_id = s.id) as sessionCount,
          (SELECT COUNT(DISTINCT player_id) FROM player_server_stats WHERE server_id = s.id) as playerCount
         FROM servers s
         ORDER BY s.name`,
                   )
                   .all() as ServerSummary[];
    }

    getServerById(serverId: number): ServerSummary | null {
        return (
            (this.db
                 .prepare(
                     `SELECT
            s.id, s.name, s.identifier, s.file_path as filePath,
            s.last_imported_at as lastImportedAt,
            (SELECT COUNT(*) FROM sessions WHERE server_id = s.id) as sessionCount,
            (SELECT COUNT(DISTINCT player_id) FROM player_server_stats WHERE server_id = s.id) as playerCount
           FROM servers s WHERE s.id = ?`,
                 )
                 .get(serverId) as ServerSummary) ?? null
        );
    }

    deleteServer(serverId: number): void {
        // Cascade deletes handle child records
        this.db.transaction(() => {
            this.db.prepare('DELETE FROM player_distances WHERE server_id = ?').run(serverId);
            this.db.prepare('DELETE FROM player_server_stats WHERE server_id = ?').run(serverId);
            this.db.prepare('DELETE FROM import_log WHERE server_id = ?').run(serverId);
            this.db.prepare('DELETE FROM sessions WHERE server_id = ?').run(serverId);
            this.db.prepare('DELETE FROM servers WHERE id = ?').run(serverId);
        })();
    }

    // --------------------------------------------------
    // Players
    // --------------------------------------------------

    getPlayers(serverId: number): PlayerSummary[] {
        return this.db
                   .prepare(
                       `SELECT
          p.id, p.steam_id as steamId, p.name,
          p.first_seen as firstSeen, p.last_seen as lastSeen,
          COALESCE(pss.race_joins, 0) as raceJoins,
          COALESCE(pss.race_finishes, 0) as raceFinishes,
          COALESCE(
            (SELECT SUM(pd.distance) FROM player_distances pd
             WHERE pd.player_id = p.id AND pd.server_id = ?),
            0
          ) as totalDistance
         FROM players p
         LEFT JOIN player_server_stats pss
           ON pss.player_id = p.id AND pss.server_id = ?
         WHERE pss.id IS NOT NULL
         ORDER BY p.name`,
                   )
                   .all(serverId, serverId) as PlayerSummary[];
    }

    getPlayerBySteamId(steamId: string): PlayerSummary | null {
        return (
            (this.db
                 .prepare(
                     `SELECT
            p.id, p.steam_id as steamId, p.name,
            p.first_seen as firstSeen, p.last_seen as lastSeen,
            0 as raceJoins, 0 as raceFinishes, 0 as totalDistance
           FROM players p WHERE p.steam_id = ?`,
                 )
                 .get(steamId) as PlayerSummary) ?? null
        );
    }

    // --------------------------------------------------
    // Sessions
    // --------------------------------------------------

    getSessions(
        serverId: number,
        options?: { limit?: number; offset?: number; hasResults?: boolean },
    ): SessionSummary[] {
        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;

        let query = `
      SELECT
        s.id, s.session_index as sessionIndex,
        s.start_time as startTime, s.end_time as endTime,
        s.finished, s.track_id as trackId,
        s.vehicle_model_id as vehicleModelId
      FROM sessions s
      WHERE s.server_id = ?
    `;

        if (options?.hasResults) {
            query += ` AND EXISTS (
        SELECT 1 FROM stages st
        JOIN stage_results sr ON sr.stage_id = st.id
        WHERE st.session_id = s.id
      )`;
        }

        query += ` ORDER BY s.start_time DESC LIMIT ? OFFSET ?`;

        const sessions = this.db.prepare(query).all(serverId, limit, offset) as Array<{
            id: number;
            sessionIndex: number;
            startTime: number;
            endTime: number | null;
            finished: number;
            trackId: number;
            vehicleModelId: number;
        }>;

        // Enrich with stage names, participant count, hasResults
        const stageStmt = this.db.prepare(
            'SELECT name FROM stages WHERE session_id = ? ORDER BY name',
        );
        const participantStmt = this.db.prepare(
            'SELECT COUNT(*) as count FROM session_participants WHERE session_id = ?',
        );
        const resultsStmt = this.db.prepare(
            'SELECT COUNT(*) as count FROM stage_results WHERE session_id = ?',
        );

        return sessions.map((s) => {
            const stageRows = stageStmt.all(s.id) as Array<{ name: string }>;
            const partCount = participantStmt.get(s.id) as { count: number };
            const resCount = resultsStmt.get(s.id) as { count: number };

            return {
                id: s.id,
                sessionIndex: s.sessionIndex,
                startTime: s.startTime,
                endTime: s.endTime,
                finished: s.finished === 1,
                trackId: s.trackId,
                vehicleModelId: s.vehicleModelId,
                stageNames: stageRows.map((r) => r.name),
                participantCount: partCount.count,
                hasResults: resCount.count > 0,
            };
        });
    }

    // --------------------------------------------------
    // Stage Results
    // --------------------------------------------------

    getStageResults(sessionId: number, stageName: string): StageResultRow[] {
        return (this.db
                    .prepare(
                        `SELECT
          sr.id, st.name as stageName, sr.position,
          sr.name, sr.steam_id as steamId,
          sr.fastest_lap_time as fastestLapTime,
          sr.laps_completed as lapsCompleted,
          sr.total_time as totalTime,
          sr.state, sr.vehicle_id as vehicleId,
          sr.is_manual as isManual
         FROM stage_results sr
         JOIN stages st ON st.id = sr.stage_id
         WHERE sr.session_id = ? AND st.name = ?
         ORDER BY sr.position ASC`,
                    )
                    .all(sessionId, stageName) as Array<StageResultRow & { isManual: number }>)
            .map((r) => ({ ...r, isManual: r.isManual === 1 }));
    }

    getAllSessionResults(sessionId: number): Record<string, StageResultRow[]> {
        const rows = (this.db
                          .prepare(
                              `SELECT
          sr.id, st.name as stageName, sr.position,
          sr.name, sr.steam_id as steamId,
          sr.fastest_lap_time as fastestLapTime,
          sr.laps_completed as lapsCompleted,
          sr.total_time as totalTime,
          sr.state, sr.vehicle_id as vehicleId,
          sr.is_manual as isManual
         FROM stage_results sr
         JOIN stages st ON st.id = sr.stage_id
         WHERE sr.session_id = ?
         ORDER BY st.name, sr.position ASC`,
                          )
                          .all(sessionId) as Array<StageResultRow & { isManual: number }>)
            .map((r) => ({ ...r, isManual: r.isManual === 1 }));

        const grouped: Record<string, StageResultRow[]> = {};
        for (const row of rows) {
            if (!grouped[row.stageName]) {
                grouped[row.stageName] = [];
            }
            grouped[row.stageName].push(row);
        }
        return grouped;
    }

    // --------------------------------------------------
    // Player result history
    // --------------------------------------------------

    getPlayerResultHistory(
        steamId: string,
        serverId?: number,
    ): PlayerResultHistory[] {
        let query = `
      SELECT
        s.session_index as sessionIndex,
        s.start_time as sessionStartTime,
        st.name as stageName,
        s.track_id as trackId,
        sr.position, sr.fastest_lap_time as fastestLapTime,
        sr.laps_completed as lapsCompleted,
        sr.total_time as totalTime, sr.state
      FROM stage_results sr
      JOIN stages st ON st.id = sr.stage_id
      JOIN sessions s ON s.id = sr.session_id
      WHERE sr.steam_id = ?
    `;

        const params: (string | number)[] = [steamId];

        if (serverId !== undefined) {
            query += ' AND s.server_id = ?';
            params.push(serverId);
        }

        query += ' ORDER BY s.start_time DESC, st.name';

        return this.db.prepare(query).all(...params) as PlayerResultHistory[];
    }

    getPlayerBestLaps(
        steamId: string,
        serverId?: number,
    ): Array<{
        trackId: number;
        bestLapTime: number;
        sessionIndex: number;
        stageName: string;
        sessionStartTime: number;
    }> {
        let query = `
      SELECT
        s.track_id as trackId,
        MIN(sr.fastest_lap_time) as bestLapTime,
        s.session_index as sessionIndex,
        st.name as stageName,
        s.start_time as sessionStartTime
      FROM stage_results sr
      JOIN stages st ON st.id = sr.stage_id
      JOIN sessions s ON s.id = sr.session_id
      WHERE sr.steam_id = ? AND sr.fastest_lap_time > 0
    `;

        const params: (string | number)[] = [steamId];

        if (serverId !== undefined) {
            query += ' AND s.server_id = ?';
            params.push(serverId);
        }

        query += ' GROUP BY s.track_id ORDER BY s.track_id';

        return this.db.prepare(query).all(...params) as Array<{
            trackId: number;
            bestLapTime: number;
            sessionIndex: number;
            stageName: string;
            sessionStartTime: number;
        }>;
    }

    // --------------------------------------------------
    // Overview / aggregate stats
    // --------------------------------------------------

    getServerOverview(serverId: number): {
        totalSessions: number;
        sessionsWithResults: number;
        totalPlayers: number;
        totalStages: Record<string, number>;
        recentSessions: SessionSummary[];
    } {
        const totalSessions = (
            this.db
                .prepare('SELECT COUNT(*) as count FROM sessions WHERE server_id = ?')
                .get(serverId) as { count: number }
        ).count;

        const sessionsWithResults = (
            this.db
                .prepare(
                    `SELECT COUNT(DISTINCT sr.session_id) as count
           FROM stage_results sr
           JOIN sessions s ON s.id = sr.session_id
           WHERE s.server_id = ?`,
                )
                .get(serverId) as { count: number }
        ).count;

        const totalPlayers = (
            this.db
                .prepare(
                    'SELECT COUNT(*) as count FROM player_server_stats WHERE server_id = ?',
                )
                .get(serverId) as { count: number }
        ).count;

        const stageCounts = this.db
                                .prepare(
                                    `SELECT st.name, COUNT(*) as count
         FROM stages st
         JOIN sessions s ON s.id = st.session_id
         WHERE s.server_id = ?
         GROUP BY st.name`,
                                )
                                .all(serverId) as Array<{ name: string; count: number }>;

        const totalStages: Record<string, number> = {};
        for (const row of stageCounts) {
            totalStages[row.name] = row.count;
        }

        const recentSessions = this.getSessions(serverId, { limit: 5 });

        return {
            totalSessions,
            sessionsWithResults,
            totalPlayers,
            totalStages,
            recentSessions,
        };
    }

    // --------------------------------------------------
    // Import history
    // --------------------------------------------------

    // --------------------------------------------------
    // Manual result entry
    // --------------------------------------------------

    insertManualResult(params: InsertManualResultParams): StageResultRow {
        const stage = this.db
                          .prepare('SELECT id FROM stages WHERE session_id = ? AND name = ?')
                          .get(params.sessionId, params.stageName) as { id: number } | undefined;
        if (!stage) {
            throw new Error(
                `Stage '${params.stageName}' not found for session ${params.sessionId}`,
            );
        }

        let playerId: number | null = null;
        if (params.steamId) {
            const player = this.db
                               .prepare('SELECT id FROM players WHERE steam_id = ?')
                               .get(params.steamId) as { id: number } | undefined;
            playerId = player?.id ?? null;
        }

        const now = Math.floor(Date.now() / 1000);
        const result = this.db
                           .prepare(
                               `INSERT INTO stage_results
                (stage_id, session_id, player_id, steam_id, name,
                 participant_id, ref_id, is_player, position,
                 fastest_lap_time, laps_completed, total_time,
                 state, vehicle_id, recorded_at, is_manual)
               VALUES (?, ?, ?, ?, ?, 0, 0, 1, ?, ?, ?, ?, ?, 0, ?, 1)`,
                           )
                           .run(
                               stage.id, params.sessionId, playerId, params.steamId, params.name,
                               params.position, params.fastestLapTime, params.lapsCompleted,
                               params.totalTime, params.state, now,
                           );

        const inserted = this.db
                             .prepare(
                                 `SELECT
              sr.id, st.name as stageName, sr.position,
              sr.name, sr.steam_id as steamId,
              sr.fastest_lap_time as fastestLapTime,
              sr.laps_completed as lapsCompleted,
              sr.total_time as totalTime,
              sr.state, sr.vehicle_id as vehicleId,
              sr.is_manual as isManual
             FROM stage_results sr
             JOIN stages st ON st.id = sr.stage_id
             WHERE sr.id = ?`,
                             )
                             .get(result.lastInsertRowid) as (StageResultRow & { isManual: number });
        return { ...inserted, isManual: true };
    }

    deleteManualResult(resultId: number): void {
        const result = this.db
                           .prepare('DELETE FROM stage_results WHERE id = ? AND is_manual = 1')
                           .run(resultId);
        if (result.changes === 0) {
            throw new Error('Result not found or is not a manual entry');
        }
    }

    getImportHistory(serverId: number, limit: number = 20): ImportLogEntry[] {
        return this.db
                   .prepare(
                       `SELECT
          id, imported_at as importedAt, file_path as filePath,
          sessions_in_file as sessionsInFile,
          sessions_imported as sessionsImported,
          sessions_updated as sessionsUpdated,
          sessions_skipped as sessionsSkipped,
          status, error_message as errorMessage
         FROM import_log
         WHERE server_id = ?
         ORDER BY imported_at DESC
         LIMIT ?`,
                   )
                   .all(serverId, limit) as ImportLogEntry[];
    }
}