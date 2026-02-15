// src/app/services/statsImportService.ts

import { createHash } from 'crypto';
import type { AppDatabase } from '../db/index.js';
import { AMS2StatsParser } from '../../shared/utils/ams2StatsParser.js';
import type {
    AMS2StatsFile,
    SessionHistory,
    Participant,
    ImportResult,
} from '../../shared/types/index.js';

export class StatsImportService {
    private db: AppDatabase;

    constructor(db: AppDatabase) {
        this.db = db;
    }

    importFile(
        filePath: string,
        fileContent: string,
        serverIdentifier?: string,
    ): ImportResult {
        const parser = AMS2StatsParser.fromJSON(fileContent);
        const data = parser.raw;

        // 1. Resolve or create server
        const serverId = this.resolveServer(data, filePath, serverIdentifier);

        // 2. Import sessions
        const result = this.importSessions(serverId, data, parser);
        result.serverName = data.stats.server.name;

        // 3. Update server metadata
        this.db
            .prepare(
                `UPDATE servers
         SET last_known_history_index = ?, last_imported_at = ?
         WHERE id = ?`,
            )
            .run(data.next_history_index, Date.now(), serverId);

        // 4. Sync player aggregate stats
        this.syncPlayerStats(serverId, data);

        // 5. Log the import
        this.logImport(serverId, filePath, fileContent.length, result);

        return result;
    }

    // --------------------------------------------------
    // Server resolution
    // --------------------------------------------------

    private resolveServer(
        data: AMS2StatsFile,
        filePath: string,
        identifier?: string,
    ): number {
        const serverName = data.stats.server.name;
        const id = identifier ?? serverName;

        const existing = this.db
                             .prepare('SELECT id FROM servers WHERE identifier = ?')
                             .get(id) as { id: number } | undefined;

        if (existing) {
            this.db
                .prepare('UPDATE servers SET name = ?, file_path = ? WHERE id = ?')
                .run(serverName, filePath, existing.id);
            return existing.id;
        }

        const result = this.db
                           .prepare(
                               'INSERT INTO servers (name, identifier, file_path, created_at) VALUES (?, ?, ?, ?)',
                           )
                           .run(serverName, id, filePath, Date.now());

        return Number(result.lastInsertRowid);
    }

    // --------------------------------------------------
    // Session import loop
    // --------------------------------------------------

    private importSessions(
        serverId: number,
        data: AMS2StatsFile,
        parser: AMS2StatsParser,
    ): ImportResult {
        const result: ImportResult = {
            serverId,
            serverName: '',
            sessionsInFile: data.stats.history.length,
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: [],
        };

        for (const session of data.stats.history) {
            try {
                const action = this.classifySession(serverId, session);

                switch (action) {
                    case 'insert':
                        this.insertSession(serverId, session, parser);
                        result.imported++;
                        break;
                    case 'update':
                        this.updateSession(serverId, session, parser);
                        result.updated++;
                        break;
                    case 'skip':
                        result.skipped++;
                        break;
                }
            } catch (error) {
                result.errors.push({
                                       sessionIndex: session.index,
                                       error: error instanceof Error ? error.message : String(error),
                                   });
            }
        }

        return result;
    }

    // --------------------------------------------------
    // Session classification (dedup logic)
    // --------------------------------------------------

    private classifySession(
        serverId: number,
        session: SessionHistory,
    ): 'insert' | 'update' | 'skip' {
        const existing = this.db
                             .prepare(
                                 'SELECT id, content_hash, finished FROM sessions WHERE server_id = ? AND session_index = ?',
                             )
                             .get(serverId, session.index) as
            | { id: number; content_hash: string; finished: number }
            | undefined;

        if (!existing) {
            return 'insert';
        }

        const currentHash = this.hashSession(session);

        if (existing.content_hash === currentHash) {
            return 'skip';
        }

        // Content changed — update
        return 'update';
    }

    private hashSession(session: SessionHistory): string {
        const hashPayload = {
            end_time: session.end_time,
            finished: session.finished,
            stages: Object.entries(session.stages).map(([name, stage]) => ({
                name,
                end_time: stage.end_time,
                resultCount: Array.isArray(stage.results)
                    ? stage.results.length
                    : 0,
            })),
            memberCount: Object.keys(session.members).length,
            participantCount: Array.isArray(session.participants)
                ? session.participants.length
                : Object.keys(session.participants).length,
        };

        return createHash('sha256')
            .update(JSON.stringify(hashPayload))
            .digest('hex');
    }

    // --------------------------------------------------
    // Insert a new session
    // --------------------------------------------------

    private insertSession(
        serverId: number,
        session: SessionHistory,
        parser: AMS2StatsParser,
    ): void {
        const insertTx = this.db.transaction(() => {
            // 1. Insert session record
            const sessionResult = this.db
                                      .prepare(
                                          `INSERT INTO sessions
           (server_id, session_index, start_time, end_time, finished,
            track_id, vehicle_model_id, vehicle_class_id, setup_json,
            imported_at, content_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                      )
                                      .run(
                                          serverId,
                                          session.index,
                                          session.start_time,
                                          session.end_time > 0 ? session.end_time : null,
                                          session.finished ? 1 : 0,
                                          session.setup.TrackId,
                                          session.setup.VehicleModelId,
                                          session.setup.VehicleClassId,
                                          JSON.stringify(session.setup),
                                          Date.now(),
                                          this.hashSession(session),
                                      );

            const sessionId = Number(sessionResult.lastInsertRowid);

            // 2. Insert participants
            this.insertParticipants(sessionId, session, parser);

            // 3. Insert members
            this.insertMembers(sessionId, session);

            // 4. Insert stages and results
            this.insertStagesAndResults(sessionId, session, parser);
        });

        insertTx();
    }

    // --------------------------------------------------
    // Update an existing session
    // --------------------------------------------------

    private updateSession(
        serverId: number,
        session: SessionHistory,
        parser: AMS2StatsParser,
    ): void {
        const existing = this.db
                             .prepare(
                                 'SELECT id FROM sessions WHERE server_id = ? AND session_index = ?',
                             )
                             .get(serverId, session.index) as { id: number } | undefined;

        if (!existing) return;

        const updateTx = this.db.transaction(() => {
            const sessionId = existing.id;

            // Delete old child records
            this.db
                .prepare('DELETE FROM stage_results WHERE session_id = ?')
                .run(sessionId);
            this.db
                .prepare('DELETE FROM stages WHERE session_id = ?')
                .run(sessionId);
            this.db
                .prepare('DELETE FROM session_members WHERE session_id = ?')
                .run(sessionId);
            this.db
                .prepare('DELETE FROM session_participants WHERE session_id = ?')
                .run(sessionId);

            // Update session record
            this.db
                .prepare(
                    `UPDATE sessions
           SET end_time = ?, finished = ?, setup_json = ?,
               content_hash = ?, updated_at = ?
           WHERE id = ?`,
                )
                .run(
                    session.end_time > 0 ? session.end_time : null,
                    session.finished ? 1 : 0,
                    JSON.stringify(session.setup),
                    this.hashSession(session),
                    Date.now(),
                    sessionId,
                );

            // Re-insert child records
            this.insertParticipants(sessionId, session, parser);
            this.insertMembers(sessionId, session);
            this.insertStagesAndResults(sessionId, session, parser);
        });

        updateTx();
    }

    // --------------------------------------------------
    // Child record insertion helpers
    // --------------------------------------------------

    private insertParticipants(
        sessionId: number,
        session: SessionHistory,
        parser: AMS2StatsParser,
    ): void {
        const participants = parser.getSessionParticipants(session);
        const insertStmt = this.db.prepare(
            `INSERT INTO session_participants
       (session_id, participant_index, player_id, steam_id, name,
        vehicle_id, livery_id, ref_id, is_player)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );

        for (let i = 0; i < participants.length; i++) {
            const p = participants[i];
            const playerId = this.resolvePlayer(
                p.SteamID,
                p.Name,
                session.start_time,
            );

            insertStmt.run(
                sessionId,
                i,
                playerId,
                p.SteamID,
                p.Name,
                p.VehicleId,
                p.LiveryId,
                p.RefId,
                p.IsPlayer,
            );
        }
    }

    private insertMembers(
        sessionId: number,
        session: SessionHistory,
    ): void {
        const insertStmt = this.db.prepare(
            `INSERT INTO session_members
       (session_id, member_id, player_id, steam_id, name,
        join_time, leave_time, participant_id, vehicle_id, livery_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );

        for (const [memberId, member] of Object.entries(session.members)) {
            const playerId = this.resolvePlayer(
                member.steamid,
                member.name,
                member.join_time,
            );

            insertStmt.run(
                sessionId,
                memberId,
                playerId,
                member.steamid,
                member.name,
                member.join_time,
                member.leave_time === -1 ? null : member.leave_time,
                member.participantid,
                member.setup.VehicleId,
                member.setup.LiveryId,
            );
        }
    }

    private insertStagesAndResults(
        sessionId: number,
        session: SessionHistory,
        parser: AMS2StatsParser,
    ): void {
        const stageStmt = this.db.prepare(
            `INSERT INTO stages (session_id, name, start_time, end_time)
       VALUES (?, ?, ?, ?)`,
        );

        const resultStmt = this.db.prepare(
            `INSERT INTO stage_results
       (stage_id, session_id, player_id, steam_id, name,
        participant_id, ref_id, is_player, position,
        fastest_lap_time, laps_completed, total_time,
        state, vehicle_id, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );

        for (const [stageName, stage] of Object.entries(session.stages)) {
            const stageResult = stageStmt.run(
                sessionId,
                stageName,
                stage.start_time,
                stage.end_time > 0 ? stage.end_time : null,
            );

            const stageId = Number(stageResult.lastInsertRowid);

            // Parse results using the existing parser (handles polymorphism)
            const results = parser.getParsedStageResults(session, stageName);

            for (const r of results) {
                const playerId = r.steamId
                    ? this.resolvePlayer(r.steamId, r.name, session.start_time)
                    : null;

                resultStmt.run(
                    stageId,
                    sessionId,
                    playerId,
                    r.steamId,
                    r.name,
                    r.participantId,
                    r.refId,
                    r.isPlayer ? 1 : 0,
                    r.position,
                    r.fastestLap > 0 ? r.fastestLap : null,
                    r.lapsCompleted,
                    r.totalTime,
                    r.state,
                    r.vehicleId,
                    Math.floor(r.recordedAt.getTime() / 1000),
                );
            }
        }
    }

    // --------------------------------------------------
    // Player resolution
    // --------------------------------------------------

    private resolvePlayer(
        steamId: string,
        name: string,
        seenAtEpoch: number,
    ): number | null {
        if (!steamId || !name) return null;

        const existing = this.db
                             .prepare('SELECT id, last_seen FROM players WHERE steam_id = ?')
                             .get(steamId) as { id: number; last_seen: number } | undefined;

        if (existing) {
            if (seenAtEpoch > existing.last_seen) {
                this.db
                    .prepare('UPDATE players SET name = ?, last_seen = ? WHERE id = ?')
                    .run(name, seenAtEpoch, existing.id);
            }
            return existing.id;
        }

        const result = this.db
                           .prepare(
                               'INSERT INTO players (steam_id, name, first_seen, last_seen) VALUES (?, ?, ?, ?)',
                           )
                           .run(steamId, name, seenAtEpoch, seenAtEpoch);

        return Number(result.lastInsertRowid);
    }

    // --------------------------------------------------
    // Player stats sync
    // --------------------------------------------------

    private syncPlayerStats(
        serverId: number,
        data: AMS2StatsFile,
    ): void {
        const upsertStmt = this.db.prepare(
            `INSERT INTO player_server_stats
       (player_id, server_id, race_joins, race_finishes, race_loads, last_joined)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(player_id, server_id) DO UPDATE SET
         race_joins = excluded.race_joins,
         race_finishes = excluded.race_finishes,
         race_loads = excluded.race_loads,
         last_joined = excluded.last_joined`,
        );

        const distStmt = this.db.prepare(
            `INSERT INTO player_distances
       (player_id, server_id, track_id, distance)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(player_id, server_id, track_id) DO UPDATE SET
         distance = excluded.distance`,
        );

        const parser = new AMS2StatsParser(data);

        for (const [steamId, playerData] of Object.entries(data.stats.players)) {
            const player = this.db
                               .prepare('SELECT id FROM players WHERE steam_id = ?')
                               .get(steamId) as { id: number } | undefined;

            if (!player) continue;

            upsertStmt.run(
                player.id,
                serverId,
                playerData.counts.race_joins,
                playerData.counts.race_finishes,
                playerData.counts.race_loads,
                playerData.last_joined,
            );

            // Sync per-track distances
            for (const [trackId, rawDistance] of Object.entries(
                playerData.counts.track_distances,
            )) {
                const distance = parser['parseDistance'](rawDistance);
                distStmt.run(player.id, serverId, parseInt(trackId, 10), distance);
            }
        }
    }

    // --------------------------------------------------
    // Import logging
    // --------------------------------------------------

    private logImport(
        serverId: number,
        filePath: string,
        fileSize: number,
        result: ImportResult,
    ): void {
        this.db
            .prepare(
                `INSERT INTO import_log
         (server_id, imported_at, file_path, file_size,
          sessions_in_file, sessions_imported, sessions_updated,
          sessions_skipped, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
                serverId,
                Date.now(),
                filePath,
                fileSize,
                result.sessionsInFile,
                result.imported,
                result.updated,
                result.skipped,
                result.errors.length === 0
                    ? 'success'
                    : result.imported > 0
                        ? 'partial'
                        : 'error',
                result.errors.length > 0
                    ? JSON.stringify(result.errors)
                    : null,
            );
    }
}