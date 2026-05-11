// src/ui/features/stats/hooks/useStats.ts

import { useState, useMemo, useCallback } from 'react';
import type { AMS2StatsFile, AMS2EnhancedStatsFile } from '../../../../shared/types';
import { AMS2StatsParser } from '../../../../shared/utils/ams2StatsParser.ts';
import { AMS2EnhancedStatsParser } from '../../../../shared/utils/ams2EnhancedStatsParser.ts';

type StatsFormat = 'sms_stats' | 'ams2_stats';

interface UseStatsReturn {
    format: StatsFormat | null;
    // sms_stats
    smsParser: AMS2StatsParser | null;
    // ams2_stats
    enhancedParser: AMS2EnhancedStatsParser | null;
    fileName: string;
    filePath: string;
    loading: boolean;
    error: string | null;
    loadFile: () => Promise<void>;
    reload: () => Promise<void>;
}

export function useStats(): UseStatsReturn {
    const [format, setFormat] = useState<StatsFormat | null>(null);
    const [smsData, setSmsData] = useState<AMS2StatsFile | null>(null);
    const [enhancedData, setEnhancedData] = useState<AMS2EnhancedStatsFile | null>(null);
    const [filePath, setFilePath] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const smsParser = useMemo(
        () => (smsData ? new AMS2StatsParser(smsData) : null),
        [smsData],
    );
    const enhancedParser = useMemo(
        () => (enhancedData ? new AMS2EnhancedStatsParser(enhancedData) : null),
        [enhancedData],
    );

    const parseFile = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await window.electron.stats.parseFile(path);
            if (!result.success) {
                setError(result.error);
                return;
            }
            setFilePath(result.filePath);
            setFileName(result.fileName);
            setFormat(result.format);
            if (result.format === 'sms_stats') {
                setSmsData(result.data);
                setEnhancedData(null);
            } else {
                setEnhancedData(result.data);
                setSmsData(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadFile = useCallback(async () => {
        try {
            const selectedPath = await window.electron.stats.selectFile();
            if (selectedPath) await parseFile(selectedPath);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to select file');
        }
    }, [parseFile]);

    const reload = useCallback(async () => {
        if (filePath) await parseFile(filePath);
    }, [filePath, parseFile]);

    return { format, smsParser, enhancedParser, fileName, filePath, loading, error, loadFile, reload };
}
