// src/app/services/ams2EnhancedStatsImportService.ts

import path from 'path';
import { createHash } from 'crypto';
import type { AppDatabase } from '../db/index.js';
import type {
    AMS2EnhancedStatsFile,
    EnhancedSession,
} from '../../shared/types/ams2EnhancedStats.js';
import type { ImportResult } from '../../shared/types/statsDb.js';

export class AMS2EnhancedStatsImportService {
    constructor(private db: AppDatabase) {}

    importFile(filePath: string, fileContent: string): ImportResult {
        const data: AMS2EnhancedStatsFile = JSON.parse(fileContent);

        const serverName = this.extractServerName(data, filePath);
        const identifier = `ams2_stats:${serverName}`;
        const serverId = this.resolveServer(serverName, identifier, filePath);

        const result: ImportResult = {
            serverId,
            serverName,
            sessionsInFile: data.sessions.length,
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: [],
        };

        for (const session of data.sessions) {
            try {
                const action = this.classifySession(serverId, session);
                switch (action) {
                    case 'insert':
                        this.insertSession(serverId, session);
                        result.imported++;
                        break;
                    case 'update':
                        this.updateSession(serverId, session);
                        result.updated++;
                        break;
                    case 'skip':
                        result.skipped++;
                        break;
                }
            } catch (error) {
                result.errors.push({
                    sessionIndex: 0,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        this.db
            .prepare('UPDATE servers SET last_imported_at = ? WHERE id = ?')
            .run(Date.now(), serverId);

        this.logImport(serverId, filePath, fileContent.length, result);

        return result;
    }

    // --------------------------------------------------
    // Server
    // --------------------------------------------------

    private extractServerName(data: AMS2EnhancedStatsFile, filePath: string): string {
        for (let i = data.sessions.length - 1; i >= 0; i--) {
            const name = data.sessions[i].attrs?.ServerName;
            if (typeof name === 'string' && name.trim()) return name.trim();
        }
        return path.basename(filePath, path.extname(filePath));
    }

    private resolveServer(name: string, identifier: string, filePath: string): number {
        const existing = this.db
            .prepare('SELECT id FROM servers WHERE identifier = ?')
            .get(identifier) as { id: number } | undefined;

        if (existing) {
            this.db
                .prepare('UPDATE servers SET name = ?, file_path = ? WHERE id = ?')
                .run(name, filePath, existing.id);
            return existing.id;
        }

        const row = this.db
            .prepare(
                'INSERT INTO servers (name, identifier, file_path, created_at) VALUES (?, ?, ?, ?)',
            )
            .run(name, identifier, filePath, Date.now());

        return Number(row.lastInsertRowid);
    }

    // --------------------------------------------------
    // Session dedup
    // --------------------------------------------------

    private uidToSessionIndex(uid: string): number {
        // uid = "YYYYMMDD_HHMMSS" → epoch seconds, negated to avoid collisions with
        // sms_stats positive sequential indices
        const m = uid.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/);
        if (m) {
            const epoch = Math.floor(
                new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`).getTime() / 1000,
            );
            return -epoch;
        }
        return -Math.floor(Date.now() / 1000);
    }

    private hashSession(session: EnhancedSession): string {
        return createHash('sha256')
            .update(
                JSON.stringify({
                    uid: session.uid,
                    resultsCount: session.results.length,
                    driversCount: session.drivers.length,
                    finished_at: session.finished_at ?? null,
                }),
            )
            .digest('hex');
    }

    private classifySession(
        serverId: number,
        session: EnhancedSession,
    ): 'insert' | 'update' | 'skip' {
        const existing = this.db
            .prepare(
                'SELECT id, content_hash FROM sessions WHERE server_id = ? AND source_uid = ?',
            )
            .get(serverId, session.uid) as
            | { id: number; content_hash: string }
            | undefined;

        if (!existing) return 'insert';
        if (existing.content_hash === this.hashSession(session)) return 'skip';
        return 'update';
    }

    // --------------------------------------------------
    // Insert / Update
    // --------------------------------------------------

    private insertSession(serverId: number, session: EnhancedSession): void {
        this.db.transaction(() => {
            const startEpoch = this.parseTime(session.started_at);
            const endEpoch = session.finished_at ? this.parseTime(session.finished_at) : null;

            const row = this.db
                .prepare(
                    `INSERT INTO sessions
                     (server_id, session_index, start_time, end_time, finished,
                      track_id, vehicle_model_id, vehicle_class_id, setup_json,
                      imported_at, content_hash, source_format, source_uid)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, 'ams2_stats', ?)`,
                )
                .run(
                    serverId,
                    this.uidToSessionIndex(session.uid),
                    startEpoch,
                    endEpoch,
                    endEpoch ? 1 : 0,
                    this.extractAttrInt(session, 'TrackId'),
                    this.extractAttrInt(session, 'VehicleModelId'),
                    JSON.stringify(session.attrs),
                    Date.now(),
                    this.hashSession(session),
                    session.uid,
                );

            const sessionId = Number(row.lastInsertRowid);
            const stageName = session.stage ?? 'Race';

            const stageRow = this.db
                .prepare(
                    'INSERT INTO stages (session_id, name, start_time, end_time) VALUES (?, ?, ?, ?)',
                )
                .run(sessionId, stageName, startEpoch, endEpoch);

            const stageId = Number(stageRow.lastInsertRowid);

            this.insertStageResults(sessionId, stageId, session, startEpoch);
            this.insertLapRecords(sessionId, stageId, session);
        })();
    }

    private updateSession(serverId: number, session: EnhancedSession): void {
        const existing = this.db
            .prepare('SELECT id FROM sessions WHERE server_id = ? AND source_uid = ?')
            .get(serverId, session.uid) as { id: number } | undefined;

        if (!existing) return;

        this.db.transaction(() => {
            const sessionId = existing.id;
            const startEpoch = this.parseTime(session.started_at);
            const endEpoch = session.finished_at ? this.parseTime(session.finished_at) : null;

            // Cascades handle stage_results and lap_records via stages
            this.db.prepare('DELETE FROM stages WHERE session_id = ?').run(sessionId);

            this.db
                .prepare(
                    `UPDATE sessions SET end_time = ?, finished = ?,
                     content_hash = ?, updated_at = ? WHERE id = ?`,
                )
                .run(endEpoch, endEpoch ? 1 : 0, this.hashSession(session), Date.now(), sessionId);

            const stageName = session.stage ?? 'Race';
            const stageRow = this.db
                .prepare(
                    'INSERT INTO stages (session_id, name, start_time, end_time) VALUES (?, ?, ?, ?)',
                )
                .run(sessionId, stageName, startEpoch, endEpoch);

            const stageId = Number(stageRow.lastInsertRowid);

            this.insertStageResults(sessionId, stageId, session, startEpoch);
            this.insertLapRecords(sessionId, stageId, session);
        })();
    }

    // --------------------------------------------------
    // Child record helpers
    // --------------------------------------------------

    private insertStageResults(
        sessionId: number,
        stageId: number,
        session: EnhancedSession,
        recordedAt: number,
    ): void {
        const stmt = this.db.prepare(
            `INSERT INTO stage_results
             (stage_id, session_id, player_id, steam_id, name,
              participant_id, ref_id, is_player, position,
              fastest_lap_time, laps_completed, total_time,
              state, vehicle_id, recorded_at, best_s1, best_s2, best_s3)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        );

        for (const r of session.results) {
            const displayName = r.name ?? `Driver ${r.refid}`;
            const syntheticSteamId = `ams2_refid_${r.refid}`;
            const playerId = this.resolvePlayer(syntheticSteamId, displayName, recordedAt);

            stmt.run(
                stageId,
                sessionId,
                playerId,
                syntheticSteamId,
                displayName,
                r.refid,
                r.refid,
                r.position,
                r.best_lap_time ?? null,
                r.laps_complete ?? 0,
                r.total_time ?? 0,
                r.state ?? 'Unknown',
                recordedAt,
                r.best_s1 ?? null,
                r.best_s2 ?? null,
                r.best_s3 ?? null,
            );
        }
    }

    private insertLapRecords(
        sessionId: number,
        stageId: number,
        session: EnhancedSession,
    ): void {
        const stmt = this.db.prepare(
            `INSERT INTO lap_records
             (session_id, stage_id, refid, name, lap_number,
              lap_time, s1, s2, s3, is_valid, race_position)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );

        for (const driver of session.drivers) {
            for (const lap of driver.laps) {
                stmt.run(
                    sessionId,
                    stageId,
                    driver.refid,
                    driver.name,
                    lap.lap,
                    lap.time ?? null,
                    lap.s1 ?? null,
                    lap.s2 ?? null,
                    lap.s3 ?? null,
                    lap.valid ? 1 : 0,
                    lap.position ?? null,
                );
            }
        }
    }

    // --------------------------------------------------
    // Player resolution
    // --------------------------------------------------

    private resolvePlayer(steamId: string, name: string, seenAtEpoch: number): number {
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

        const row = this.db
            .prepare(
                'INSERT INTO players (steam_id, name, first_seen, last_seen) VALUES (?, ?, ?, ?)',
            )
            .run(steamId, name, seenAtEpoch, seenAtEpoch);

        return Number(row.lastInsertRowid);
    }

    // --------------------------------------------------
    // Utilities
    // --------------------------------------------------

    private parseTime(isoString: string): number {
        return Math.floor(new Date(isoString).getTime() / 1000);
    }

    private extractAttrInt(session: EnhancedSession, key: string): number {
        const val = session.attrs?.[key];
        if (val === undefined || val === null) return 0;
        const n = Number(val);
        return Number.isFinite(n) ? n : 0;
    }

    // --------------------------------------------------
    // Import log
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
                result.errors.length > 0 ? JSON.stringify(result.errors) : null,
            );
    }
}
