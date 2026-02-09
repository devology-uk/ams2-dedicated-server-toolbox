// src/shared/utils/ams2StatsParser.ts

import type { AMS2StatsFile, Participant, SessionHistory, PlayerStats } from '../types/ams2Stats.js';

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
    return Object.entries(this.data.stats.players).map(([steamId, player]: [string, PlayerStats]) => ({
      steamId,
      name: player.name,
      lastJoined: new Date(player.last_joined * 1000),
      raceJoins: player.counts.race_joins,
      raceFinishes: player.counts.race_finishes,
      totalDistance: this.sumValues(player.counts.track_distances),
    }));
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
    return [...this.data.stats.history]
      .sort((a, b) => b.start_time - a.start_time)
      .slice(0, count);
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
    return `${meters} m`;
  }

  // --- Track & Vehicle Stats ---
  getTrackUsage(): Array<{ trackId: string; sessions: number; distance: number }> {
    const { tracks, track_distances } = this.data.stats.session.counts;

    return Object.keys({ ...tracks, ...track_distances }).map((trackId) => ({
      trackId,
      sessions: tracks[trackId] || 0,
      distance: track_distances[trackId] || 0,
    }));
  }

  getVehicleUsage(): Array<{ vehicleId: string; distance: number }> {
    const { vehicle_distances } = this.data.stats.session.counts;

    return Object.entries(vehicle_distances).map(([vehicleId, distance]) => ({
      vehicleId,
      distance: distance as number,
    }));
  }

  // --- Utility Methods ---
  private sumValues(obj: Record<string, number>): number {
    return Object.values(obj).reduce((sum, val) => sum + val, 0);
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

  private formatStageDurations(durations: Record<string, number>): Record<string, string> {
    const formatted: Record<string, string> = {};
    for (const [stage, seconds] of Object.entries(durations)) {
      formatted[stage] = this.formatDuration(seconds);
    }
    return formatted;
  }
}