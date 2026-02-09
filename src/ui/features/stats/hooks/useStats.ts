import { useState, useEffect, useMemo, useCallback } from 'react';
import type { AMS2StatsFile } from '../../../../shared/types';
import { AMS2StatsParser } from '../utils/ams2StatsParser';

interface UseStatsReturn {
  data: AMS2StatsFile | null;
  parser: AMS2StatsParser | null;
  fileName: string;
  filePath: string;
  loading: boolean;
  error: string | null;
  loadFile: () => Promise<void>;
  reload: () => Promise<void>;
  clearError: () => void;
}

export function useStats(): UseStatsReturn {
  const [data, setData] = useState<AMS2StatsFile | null>(null);
  const [filePath, setFilePath] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parser = useMemo(() => {
    return data ? new AMS2StatsParser(data) : null;
  }, [data]);

  // Listen for live updates
  useEffect(() => {
    const cleanup = window.electron.stats.onFileUpdated(({ data }) => {
      setData(data);
    });

    return cleanup;
  }, []);

  const parseFile = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electron.stats.parseFile(path);

      if (result.success) {
        setData(result.data);
        setFilePath(result.filePath);
        setFileName(result.fileName);
      } else {
        setError(result.error);
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
      if (selectedPath) {
        await parseFile(selectedPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select file');
    }
  }, [parseFile]);

  const reload = useCallback(async () => {
    if (filePath) {
      await parseFile(filePath);
    }
  }, [filePath, parseFile]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    parser,
    fileName,
    filePath,
    loading,
    error,
    loadFile,
    reload,
    clearError,
  };
}