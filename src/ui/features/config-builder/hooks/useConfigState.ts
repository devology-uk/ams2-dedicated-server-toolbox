// src/ui/features/config-builder/hooks/useConfigState.ts

// src/ui/features/config-builder/hooks/useConfigState.ts

import { useState, useCallback } from 'react';
import type { ServerConfig, SessionAttributes } from '../../../../shared/types/config';
import { parseServerConfig, serializeServerConfig } from '../utils/hocon-parser';

// ... rest of the file stays the same

export interface UseConfigStateResult {
  config: ServerConfig;
  isDirty: boolean;
  
  // Update methods
  updateRootField: <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => void;
  updateSessionAttribute: <K extends keyof SessionAttributes>(key: K, value: SessionAttributes[K]) => void;
  
  // Bulk operations
  setConfig: (config: ServerConfig) => void;
  resetConfig: () => void;
  
  // Import/Export
  importFromString: (content: string) => { success: boolean; error?: string };
  exportToString: () => string;
  
  // Track original for dirty checking
  markAsSaved: () => void;
}

const DEFAULT_CONFIG: ServerConfig = {
  logLevel: 'info',
  eventsLogSize: 10000,
  name: 'My AMS2 Server',
  secure: false,
  maxPlayerCount: 20,
  steamPort: 27015,
  hostPort: 27016,
  queryPort: 27017,
  sleepWaiting: 50,
  sleepActive: 10,
  sportsPlay: false,
  enableHttpApi: true,
  httpApiLogLevel: 'warning',
  enableLuaApi: false,
  allowEmptyJoin: true,
  controlGameSetup: true,
  sessionAttributes: {
    GridSize: 20,
    MaxPlayers: 20,
    PracticeLength: 15,
    QualifyLength: 10,
    RaceLength: 5,
    OpponentDifficulty: 50,
    DamageType: 2,
    TireWearType: 1,
    FuelUsageType: 1,
    PenaltiesType: 1,
  },
};

export function useConfigState(initialConfig?: ServerConfig): UseConfigStateResult {
  const [config, setConfigInternal] = useState<ServerConfig>(initialConfig ?? DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<string>(
    JSON.stringify(initialConfig ?? DEFAULT_CONFIG)
  );

  const isDirty = JSON.stringify(config) !== originalConfig;

  const updateRootField = useCallback(<K extends keyof ServerConfig>(
    key: K,
    value: ServerConfig[K]
  ) => {
    setConfigInternal(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateSessionAttribute = useCallback(<K extends keyof SessionAttributes>(
    key: K,
    value: SessionAttributes[K]
  ) => {
    setConfigInternal(prev => ({
      ...prev,
      sessionAttributes: {
        ...prev.sessionAttributes,
        [key]: value,
      },
    }));
  }, []);

  const setConfig = useCallback((newConfig: ServerConfig) => {
    setConfigInternal(newConfig);
  }, []);

  const resetConfig = useCallback(() => {
    setConfigInternal(DEFAULT_CONFIG);
    setOriginalConfig(JSON.stringify(DEFAULT_CONFIG));
  }, []);

  const importFromString = useCallback((content: string): { success: boolean; error?: string } => {
    try {
      const parsed = parseServerConfig(content);
      setConfigInternal(parsed);
      setOriginalConfig(JSON.stringify(parsed));
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to parse config' 
      };
    }
  }, []);

  const exportToString = useCallback((): string => {
    return serializeServerConfig(config);
  }, [config]);

  const markAsSaved = useCallback(() => {
    setOriginalConfig(JSON.stringify(config));
  }, [config]);

  return {
    config,
    isDirty,
    updateRootField,
    updateSessionAttribute,
    setConfig,
    resetConfig,
    importFromString,
    exportToString,
    markAsSaved,
  };
}