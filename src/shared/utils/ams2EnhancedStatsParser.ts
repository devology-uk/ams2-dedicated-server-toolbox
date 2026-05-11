// src/shared/utils/ams2EnhancedStatsParser.ts

import type {
    AMS2EnhancedStatsFile,
    EnhancedSession,
    EnhancedResult,
    EnhancedDriver,
} from '../types/ams2EnhancedStats.js';

export class AMS2EnhancedStatsParser {
    private data: AMS2EnhancedStatsFile;

    constructor(data: AMS2EnhancedStatsFile) {
        this.data = data;
    }

    static fromJSON(json: string): AMS2EnhancedStatsParser {
        return new AMS2EnhancedStatsParser(JSON.parse(json) as AMS2EnhancedStatsFile);
    }

    get raw(): AMS2EnhancedStatsFile { return this.data; }

    getPluginVersion(): string { return this.data.meta.plugin_version; }

    getServerName(): string {
        // Use the ServerName session attribute from the most recent finished session.
        for (let i = this.data.sessions.length - 1; i >= 0; i--) {
            const name = this.data.sessions[i]?.attrs?.ServerName;
            if (typeof name === 'string' && name) return name;
        }
        return 'Unknown Server';
    }

    getSessions(): EnhancedSession[] { return this.data.sessions; }

    getUniqueDriverCount(): number {
        const refids = new Set<number>();
        for (const session of this.data.sessions) {
            for (const d of session.drivers) {
                refids.add(d.refid);
            }
        }
        return refids.size;
    }

    getTrackName(session: EnhancedSession): string {
        const variation = session.attrs?.TrackVariation ?? session.attrs?.TrackLocation;
        return typeof variation === 'string' ? variation : '—';
    }

    /** Format milliseconds as M:SS.mmm */
    static formatMs(ms: number | null | undefined): string {
        if (ms == null) return '—';
        const total_s = Math.floor(ms / 1000);
        const millis  = ms % 1000;
        const minutes = Math.floor(total_s / 60);
        const secs    = total_s % 60;
        return `${minutes}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
    }

    /** Summarise a session's result for display */
    getResultRows(session: EnhancedSession): (EnhancedResult & { displayName: string })[] {
        return session.results.map((r) => ({
            ...r,
            displayName: r.name ?? `#${r.refid}`,
        }));
    }

    /** Get all drivers that started, sorted by final position (DNFs last) */
    getDriverRows(session: EnhancedSession): (EnhancedDriver & { displayName: string })[] {
        return session.drivers
            .filter((d) => d.started)
            .map((d) => ({ ...d, displayName: d.name ?? `#${d.refid}` }))
            .sort((a, b) => {
                const pa = a.final_position ?? 9999;
                const pb = b.final_position ?? 9999;
                return pa !== pb ? pa - pb : b.laps.length - a.laps.length;
            });
    }
}
