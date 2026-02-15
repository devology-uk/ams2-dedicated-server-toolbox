// src/ui/utils/formatters.ts
// Shared formatting utilities used across stats and results views.

/**
 * Converts a stage key like "practice1" to "Practice 1".
 */
export function formatStageName(stage: string): string {
    return stage
        .replace(/([0-9]+)/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

/**
 * Formats a lap time in milliseconds to "m:ss.SSS" or "ss.SSS".
 */
export function formatLapTime(ms: number | null): string {
    if (!ms || ms <= 0) return '--:--.---';

    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
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
 * Formats a total race time in milliseconds to "h:mm:ss" or "m:ss".
 */
export function formatTotalTime(ms: number): string {
    if (ms <= 0) return '-';

    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats a duration in seconds to "Xh Ym" or "Xm".
 */
export function formatDurationSeconds(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Formats a duration between two epoch timestamps to "Xh Ym" or "Xm".
 */
export function formatDurationRange(startTime: number, endTime: number | null): string {
    if (!endTime) return '-';
    return formatDurationSeconds(endTime - startTime);
}

/**
 * Formats an epoch timestamp to a locale date string.
 */
export function formatEpochDate(epoch: number): string {
    return new Date(epoch * 1000).toLocaleDateString();
}

/**
 * Formats an epoch timestamp to a short time string (HH:MM).
 */
export function formatEpochTime(epoch: number): string {
    return new Date(epoch * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
