// src/shared/utils/ams2StatsParser.ts

import type {
    AMS2StatsFile,
    Member,
    Participant,
    ParsedMember,
    ParsedResult,
    PlayerStats,
    SessionHistory,
    Stage,
    StageOverview,
    StageResult,
    StageType,
} from '../types/index.js';

export class AMS2StatsParser {
    private data: AMS2StatsFile;

    constructor(jsonData: AMS2StatsFile) {
        this.data = jsonData;
    }

    static fromJSON(jsonString: string): AMS2StatsParser {
        const parsed = JSON.parse(jsonString) as AMS2StatsFile;
        return new AMS2StatsParser(parsed);
    }

    get raw(): AMS2StatsFile {
        return this.data;
    }

    // =============================================
    // Server Info
    // =============================================

    getServerName(): string {
        return this.data.stats.server.name;
    }

    getServerUptime(): { current: number; total: number } {
        return {
            current: parseFloat(this.data.stats.server.uptime),
            total: parseFloat(this.data.stats.server.total_uptime),
        };
    }

    getFormattedUptime(): string {
        const seconds = parseFloat(this.data.stats.server.uptime);
        return this.formatDuration(seconds);
    }

    // =============================================
    // Players
    // =============================================

    getPlayers(): Array<{
        steamId: string;
        name: string;
        lastJoined: Date;
        raceJoins: number;
        raceFinishes: number;
        totalDistance: number;
    }> {
        return Object.entries(this.data.stats.players).map(
            ([steamId, player]: [string, PlayerStats]) => ({
                steamId,
                name: player.name,
                lastJoined: new Date(player.last_joined * 1000),
                raceJoins: player.counts.race_joins,
                raceFinishes: player.counts.race_finishes,
                totalDistance: this.sumValues(player.counts.track_distances),
            }),
        );
    }

    getPlayerBySteamId(steamId: string): PlayerStats | null {
        return this.data.stats.players[steamId] || null;
    }

    getPlayerLeaderboard(sortBy: 'distance' | 'joins' | 'finishes' = 'distance') {
        const players = this.getPlayers();

        return players.sort((a, b) => {
            switch (sortBy) {
                case 'distance':
                    return b.totalDistance - a.totalDistance;
                case 'joins':
                    return b.raceJoins - a.raceJoins;
                case 'finishes':
                    return b.raceFinishes - a.raceFinishes;
                default:
                    return 0;
            }
        });
    }

    // =============================================
    // Session History
    // =============================================

    getSessionHistory(): SessionHistory[] {
        return this.data.stats.history;
    }

    getRecentSessions(count: number = 10): SessionHistory[] {
        return [...this.data.stats.history]
            .sort((a, b) => b.start_time - a.start_time)
            .slice(0, count);
    }

    getSessionParticipants(session: SessionHistory): Participant[] {
        const { participants } = session;
        if (Array.isArray(participants)) {
            return participants;
        }
        return Object.values(participants);
    }

    /**
     * Get only sessions that have at least one stage with results
     */
    getSessionsWithResults(): SessionHistory[] {
        return this.data.stats.history.filter((session) => {
            return Object.values(session.stages).some((stage) =>
                                                          this.stageHasResults(stage),
            );
        });
    }

    /**
     * Get sessions that contain a specific stage type (e.g., 'qualifying1', 'race1')
     */
    getSessionsByStageType(stageType: StageType): SessionHistory[] {
        return this.data.stats.history.filter((session) =>
                                                  stageType in session.stages,
        );
    }

    // =============================================
    // Members (Join/Leave Tracking)
    // =============================================

    /**
     * Get raw member entries for a session
     */
    getSessionMembers(session: SessionHistory): Member[] {
        return Object.values(session.members);
    }

    /**
     * Get parsed member data with computed fields
     */
    getParsedMembers(session: SessionHistory): ParsedMember[] {
        return Object.entries(session.members).map(([id, member]) => {
            const leaveTime =
                member.leave_time === -1 ? null : new Date(member.leave_time * 1000);
            const joinTime = new Date(member.join_time * 1000);

            // Calculate session duration
            const leaveEpoch =
                member.leave_time === -1
                    ? session.end_time > 0
                        ? session.end_time
                        : Math.floor(Date.now() / 1000)
                    : member.leave_time;

            const sessionDuration = leaveEpoch - member.join_time;

            return {
                id,
                name: member.name,
                steamId: member.steamid,
                joinTime,
                leaveTime,
                sessionDuration: Math.max(0, sessionDuration),
                participantId: member.participantid,
                isSpectator: member.participantid === -1,
                setup: member.setup,
            };
        });
    }

    /**
     * Get unique players from members (deduplicates rejoins by steamId)
     */
    getUniqueSessionPlayers(
        session: SessionHistory,
    ): Array<{
        steamId: string;
        name: string;
        joinCount: number;
        totalTimeInSession: number;
        firstJoin: Date;
        lastLeave: Date | null;
    }> {
        const membersByPlayer = new Map<
            string,
            { name: string; joins: Member[] }
        >();

        for (const member of Object.values(session.members)) {
            const existing = membersByPlayer.get(member.steamid);
            if (existing) {
                existing.joins.push(member);
                // Use latest name
                if (member.join_time > existing.joins[0].join_time) {
                    existing.name = member.name;
                }
            } else {
                membersByPlayer.set(member.steamid, {
                    name: member.name,
                    joins: [member],
                });
            }
        }

        return Array.from(membersByPlayer.entries()).map(
            ([steamId, { name, joins }]) => {
                const totalTime = joins.reduce((sum, m) => {
                    const leaveEpoch =
                        m.leave_time === -1
                            ? session.end_time > 0
                                ? session.end_time
                                : Math.floor(Date.now() / 1000)
                            : m.leave_time;
                    return sum + Math.max(0, leaveEpoch - m.join_time);
                }, 0);

                const firstJoin = Math.min(...joins.map((m) => m.join_time));
                const lastLeaveValues = joins.map((m) => m.leave_time);
                const stillConnected = lastLeaveValues.includes(-1);
                const lastLeave = stillConnected
                    ? null
                    : new Date(Math.max(...lastLeaveValues) * 1000);

                return {
                    steamId,
                    name,
                    joinCount: joins.length,
                    totalTimeInSession: totalTime,
                    firstJoin: new Date(firstJoin * 1000),
                    lastLeave,
                };
            },
        );
    }

    // =============================================
    // Stages
    // =============================================

    /**
     * Get stage names for a session (e.g., ['practice1', 'qualifying1'])
     */
    getStageNames(session: SessionHistory): string[] {
        return Object.keys(session.stages);
    }

    /**
     * Get a structured overview of all stages in a session
     */
    getStageOverviews(session: SessionHistory): StageOverview[] {
        return Object.entries(session.stages).map(([stageName, stage]) => {
            const endTime =
                stage.end_time > 0 ? new Date(stage.end_time * 1000) : null;
            const startTime = new Date(stage.start_time * 1000);
            const durationEnd =
                stage.end_time > 0
                    ? stage.end_time
                    : session.end_time > 0
                        ? session.end_time
                        : Math.floor(Date.now() / 1000);

            return {
                stageName,
                stageType: stageName as StageType,
                startTime,
                endTime,
                duration: Math.max(0, durationEnd - stage.start_time),
                resultCount: this.getStageResults(stage).length,
                hasResults: this.stageHasResults(stage),
            };
        });
    }

    // =============================================
    // Results
    // =============================================

    /**
     * Check if a stage has any results
     */
    stageHasResults(stage: Stage): boolean {
        return Array.isArray(stage.results) && stage.results.length > 0;
    }

    /**
     * Get raw results from a stage, handling the object/array polymorphism
     */
    getStageResults(stage: Stage): StageResult[] {
        if (Array.isArray(stage.results)) {
            return stage.results;
        }
        // Empty object {} = no results
        return [];
    }

    /**
     * Get parsed/enriched results for a specific stage in a session.
     * Cross-references participants to resolve Steam IDs.
     */
    getParsedStageResults(
        session: SessionHistory,
        stageName: string,
    ): ParsedResult[] {
        const stage = session.stages[stageName];
        if (!stage) return [];

        const results = this.getStageResults(stage);
        if (results.length === 0) return [];

        // Build participant lookup for Steam ID resolution
        const participantMap = new Map<number, Participant>();

        if (Array.isArray(session.participants)) {
            session.participants.forEach((p, idx) => participantMap.set(idx, p));
        } else {
            Object.entries(session.participants).forEach(([key, p]) =>
                                                             participantMap.set(parseInt(key, 10), p),
            );
        }

        // Also build a refid-to-member lookup for Steam ID via members
        const refIdToSteamId = new Map<number, string>();
        for (const member of Object.values(session.members)) {
            if (member.participantid >= 0) {
                const participant = participantMap.get(member.participantid);
                if (participant) {
                    refIdToSteamId.set(participant.RefId, member.steamid);
                }
            }
        }

        return results.map((result) => {
            // Try to resolve Steam ID from participant, then from member
            const participant = participantMap.get(result.participantid);
            let steamId: string | null = participant?.SteamID ?? null;

            if (!steamId) {
                steamId = refIdToSteamId.get(result.refid) ?? null;
            }

            return {
                position: result.attributes.RacePosition,
                name: result.name,
                steamId,
                fastestLap: result.attributes.FastestLapTime,
                fastestLapFormatted: this.formatLapTime(
                    result.attributes.FastestLapTime,
                ),
                lapsCompleted: result.attributes.Lap,
                totalTime: result.attributes.TotalTime,
                totalTimeFormatted: this.formatLapTime(result.attributes.TotalTime),
                state: result.attributes.State,
                vehicleId: result.attributes.VehicleId,
                isPlayer: result.is_player,
                participantId: result.participantid,
                refId: result.refid,
                recordedAt: new Date(result.time * 1000),
            };
        });
    }

    /**
     * Get all results across all stages in a session, keyed by stage name
     */
    getAllSessionResults(
        session: SessionHistory,
    ): Record<string, ParsedResult[]> {
        const allResults: Record<string, ParsedResult[]> = {};

        for (const stageName of Object.keys(session.stages)) {
            const results = this.getParsedStageResults(session, stageName);
            if (results.length > 0) {
                allResults[stageName] = results;
            }
        }

        return allResults;
    }

    /**
     * Convenience: get practice results for a session
     */
    getPracticeResults(session: SessionHistory): ParsedResult[] {
        return this.getParsedStageResults(session, 'practice1');
    }

    /**
     * Convenience: get qualifying results for a session
     */
    getQualifyingResults(session: SessionHistory): ParsedResult[] {
        return this.getParsedStageResults(session, 'qualifying1');
    }

    /**
     * Convenience: get race results for a session
     */
    getRaceResults(session: SessionHistory): ParsedResult[] {
        return this.getParsedStageResults(session, 'race1');
    }

    /**
     * Get the fastest lap across all results in a stage
     */
    getStageFastestLap(
        session: SessionHistory,
        stageName: string,
    ): ParsedResult | null {
        const results = this.getParsedStageResults(session, stageName);
        const validResults = results.filter((r) => r.fastestLap > 0);

        if (validResults.length === 0) return null;

        return validResults.reduce((fastest, current) =>
                                       current.fastestLap < fastest.fastestLap ? current : fastest,
        );
    }

    /**
     * Get results for a specific player (by Steam ID) across all sessions and stages
     */
    getPlayerResultHistory(
        steamId: string,
    ): Array<{
        sessionIndex: number;
        stageName: string;
        startTime: Date;
        trackId: number;
        result: ParsedResult;
    }> {
        const history: Array<{
            sessionIndex: number;
            stageName: string;
            startTime: Date;
            trackId: number;
            result: ParsedResult;
        }> = [];

        for (const session of this.data.stats.history) {
            for (const stageName of Object.keys(session.stages)) {
                const results = this.getParsedStageResults(session, stageName);
                const playerResult = results.find((r) => r.steamId === steamId);

                if (playerResult) {
                    history.push({
                                     sessionIndex: session.index,
                                     stageName,
                                     startTime: new Date(session.start_time * 1000),
                                     trackId: session.setup.TrackId,
                                     result: playerResult,
                                 });
                }
            }
        }

        return history.sort(
            (a, b) => b.startTime.getTime() - a.startTime.getTime(),
        );
    }

    /**
     * Get a player's personal best lap time per track across all sessions
     */
    getPlayerBestLaps(
        steamId: string,
    ): Array<{
        trackId: number;
        bestLapTime: number;
        bestLapFormatted: string;
        sessionIndex: number;
        stageName: string;
        date: Date;
    }> {
        const bestByTrack = new Map<
            number,
            {
                trackId: number;
                bestLapTime: number;
                sessionIndex: number;
                stageName: string;
                date: Date;
            }
        >();

        for (const session of this.data.stats.history) {
            const trackId = session.setup.TrackId;

            for (const stageName of Object.keys(session.stages)) {
                const results = this.getParsedStageResults(session, stageName);
                const playerResult = results.find(
                    (r) => r.steamId === steamId && r.fastestLap > 0,
                );

                if (playerResult) {
                    const existing = bestByTrack.get(trackId);
                    if (!existing || playerResult.fastestLap < existing.bestLapTime) {
                        bestByTrack.set(trackId, {
                            trackId,
                            bestLapTime: playerResult.fastestLap,
                            sessionIndex: session.index,
                            stageName,
                            date: new Date(session.start_time * 1000),
                        });
                    }
                }
            }
        }

        return Array.from(bestByTrack.values())
                    .map((entry) => ({
                        ...entry,
                        bestLapFormatted: this.formatLapTime(entry.bestLapTime),
                    }))
                    .sort((a, b) => a.trackId - b.trackId);
    }

    // =============================================
    // Session Statistics (aggregate)
    // =============================================

    getSessionStats() {
        const { counts } = this.data.stats.session;
        return {
            totalLobbies: counts.lobbies,
            totalSessions: counts.sessions,
            raceFinishes: counts.race_finishes,
            raceLoads: counts.race_loads,
            playerFinishes: counts.player_finishes,
            stageCounts: counts.stage_counts,
            stageDurations: this.formatStageDurations(counts.stage_durations),
            trackDistances: counts.track_distances,
            vehicleDistances: counts.vehicle_distances,
        };
    }

    getTotalDistance(): number {
        return this.sumValues(this.data.stats.session.counts.track_distances);
    }

    getFormattedTotalDistance(): string {
        const meters = this.getTotalDistance();
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(2)} km`;
        }
        return `${meters.toFixed(2)} m`;
    }

    getTrackUsage(): Array<{
        trackId: string;
        sessions: number;
        distance: number;
    }> {
        const { tracks, track_distances } = this.data.stats.session.counts;

        return Object.keys({ ...tracks, ...track_distances }).map((trackId) => ({
            trackId,
            sessions: tracks[trackId] || 0,
            distance: this.parseDistance(track_distances[trackId]),
        }));
    }

    getVehicleUsage(): Array<{ vehicleId: string; distance: number }> {
        const { vehicle_distances } = this.data.stats.session.counts;

        return Object.entries(vehicle_distances).map(([vehicleId, rawDistance]) => ({
            vehicleId,
            distance: this.parseDistance(rawDistance),
        }));
    }

    // =============================================
    // Formatting Utilities
    // =============================================

    /**
     * Format a lap time from milliseconds to M:SS.mmm
     */
    formatLapTime(milliseconds: number): string {
        if (milliseconds <= 0) return '--:--.---';

        const totalSeconds = milliseconds / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // Format seconds as SS.mmm
        const secWhole = Math.floor(seconds);
        const secFraction = Math.round((seconds - secWhole) * 1000);

        const secStr = secWhole.toString().padStart(2, '0');
        const msStr = secFraction.toString().padStart(3, '0');

        if (minutes > 0) {
            return `${minutes}:${secStr}.${msStr}`;
        }
        return `${secStr}.${msStr}`;
    }

    /**
     * Format a duration in seconds to human-readable Xd Xh Xm Xs
     */
    formatDuration(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }

    // =============================================
    // Private Utilities
    // =============================================

    private sumValues(obj: Record<string, number | string>): number {
        return Object.values(obj).reduce<number>((sum, val) => {
            return sum + this.parseDistance(val);
        }, 0);
    }

    /**
     * Parse distance values that may be in millimeters and may have
     * overflowed past 32-bit signed integer range.
     * Returns meters.
     */
    private parseDistance(value: number | string | undefined): number {
        if (value === undefined) return 0;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return 0;

        // Convert negative (overflow) to unsigned 32-bit equivalent
        const distance = num < 0 ? 4294967296 + num : num;

        // Convert from millimeters to meters
        return distance / 1000;
    }

    private formatStageDurations(
        durations: Record<string, number | string>,
    ): Record<string, string> {
        const formatted: Record<string, string> = {};
        for (const [stage, value] of Object.entries(durations)) {
            const seconds = this.parseDuration(value);
            formatted[stage] = this.formatDuration(seconds);
        }
        return formatted;
    }

    private parseDuration(value: number | string | undefined): number {
        if (value === undefined) return 0;
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return 0;

        // Convert negative (overflow) to unsigned 32-bit equivalent
        const duration = num < 0 ? 4294967296 + num : num;

        // Convert from milliseconds to seconds
        return duration / 1000;
    }
}