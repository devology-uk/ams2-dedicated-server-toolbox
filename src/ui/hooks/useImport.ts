// src/ui/features/results/hooks/useImport.ts

import { useState, useCallback } from 'react';
import type { ImportResult } from '../../shared/types';

interface UseImportReturn {
    importing: boolean;
    lastImport: ImportResult | null;
    error: string | null;
    importFile: (filePath?: string) => Promise<ImportResult | null>;
    importEnhancedFile: (filePath?: string, serverNameHint?: string) => Promise<ImportResult | null>;
    importAuto: (serverNameHint?: string) => Promise<ImportResult | null>;
    clearLastImport: () => void;
}

export function useImport(): UseImportReturn {
    const [importing, setImporting] = useState(false);
    const [lastImport, setLastImport] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runImport = useCallback(
        async (
            fn: (filePath?: string) => Promise<{ success: boolean; data?: ImportResult; error?: string }>,
            filePath?: string,
        ): Promise<ImportResult | null> => {
            setImporting(true);
            setError(null);
            try {
                const result = await fn(filePath);
                if (result.success && result.data) {
                    setLastImport(result.data);
                    return result.data;
                } else {
                    setError(result.error ?? 'Import failed');
                    return null;
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                return null;
            } finally {
                setImporting(false);
            }
        },
        [],
    );

    const importFile = useCallback(
        (filePath?: string) => runImport(window.electron.statsDb.importFile, filePath),
        [runImport],
    );

    const importEnhancedFile = useCallback(
        (filePath?: string, serverNameHint?: string) =>
            runImport(
                (fp) => window.electron.statsDb.importEnhancedFile(fp, serverNameHint),
                filePath,
            ),
        [runImport],
    );

    const importAuto = useCallback(async (serverNameHint?: string): Promise<ImportResult | null> => {
        const selectedPath = await window.electron.stats.selectFile();
        if (!selectedPath) return null;

        const parsed = await window.electron.stats.parseFile(selectedPath);
        if (!parsed.success) {
            setError(parsed.error ?? 'Unrecognised file format');
            return null;
        }

        if (parsed.format === 'ams2_stats') {
            return runImport(
                (fp) => window.electron.statsDb.importEnhancedFile(fp, serverNameHint),
                selectedPath,
            );
        }
        return runImport(window.electron.statsDb.importFile, selectedPath);
    }, [runImport]);

    const clearLastImport = useCallback(() => {
        setLastImport(null);
        setError(null);
    }, []);

    return {
        importing,
        lastImport,
        error,
        importFile,
        importEnhancedFile,
        importAuto,
        clearLastImport,
    };
}