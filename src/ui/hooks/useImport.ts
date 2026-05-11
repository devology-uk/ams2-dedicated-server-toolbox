// src/ui/features/results/hooks/useImport.ts

import { useState, useCallback } from 'react';
import type { ImportResult } from '../../shared/types';

interface UseImportReturn {
    importing: boolean;
    lastImport: ImportResult | null;
    error: string | null;
    importFile: (filePath?: string) => Promise<ImportResult | null>;
    importEnhancedFile: (filePath?: string) => Promise<ImportResult | null>;
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
        (filePath?: string) => runImport(window.electron.statsDb.importEnhancedFile, filePath),
        [runImport],
    );

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
        clearLastImport,
    };
}