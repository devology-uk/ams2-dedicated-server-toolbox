// src/shared/utils/ams2StatsParser.ts

import type {
  AMS2StatsFile,
  Participant,
  PlayerStats,
  SessionHistory,
} from '../../../../shared/types';

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

  // --- Server Info ---
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

  // --- Players ---
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

  // --- Session History ---
  getSessionHistory(): SessionHistory[] {
    return this.data.stats.history;
  }

  getRecentSessions(count: number = 10): SessionHistory[] {
    return [...this.data.stats.history].sort((a, b) => b.start_time - a.start_time).slice(0, count);
  }

  getSessionParticipants(session: SessionHistory): Participant[] {
    const { participants } = session;

    // Handle both array and object formats
    if (Array.isArray(participants)) {
      return participants;
    }

    return Object.values(participants);
  }

  // --- Session Statistics ---
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
  getTrackUsage(): Array<{ trackId: string; sessions: number; distance: number }> {
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

  // --- Utility Methods ---
  private sumValues(obj: Record<string, number | string>): number {
    return Object.values(obj).reduce<number>((sum, val) => {
      return sum + this.parseDistance(val);
    }, 0);
  }

  // Distance values appear to be in millimeters
  private parseDistance(value: number | string | undefined): number {
    if (value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 0;

    // Convert negative (overflow) to unsigned 32-bit equivalent
    let distance = num < 0 ? 4294967296 + num : num;

    // Convert from millimeters to meters
    return distance / 1000;
  }

  private formatDuration(seconds: number): string {
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

  private formatStageDurations(durations: Record<string, number | string>): Record<string, string> {
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
    let duration = num < 0 ? 4294967296 + num : num;

    // Convert from milliseconds to seconds
    return duration / 1000;
  }
}
