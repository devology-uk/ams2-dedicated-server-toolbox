// src/ui/features/results/hooks/useImport.ts

import { useState, useCallback } from 'react';
import type { ImportResult } from '../../../../shared/types';

interface UseImportReturn {
    importing: boolean;
    lastImport: ImportResult | null;
    error: string | null;
    importFile: (filePath?: string) => Promise<ImportResult | null>;
    clearLastImport: () => void;
}

export function useImport(): UseImportReturn {
    const [importing, setImporting] = useState(false);
    const [lastImport, setLastImport] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const importFile = useCallback(async (filePath?: string): Promise<ImportResult | null> => {
        setImporting(true);
        setError(null);

        try {
            const result = await window.electron.statsDb.importFile(filePath);

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
    }, []);

    const clearLastImport = useCallback(() => {
        setLastImport(null);
        setError(null);
    }, []);

    return {
        importing,
        lastImport,
        error,
        importFile,
        clearLastImport,
    };
}