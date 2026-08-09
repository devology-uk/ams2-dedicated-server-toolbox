// src/ui/features/sms-rotate/hooks/useSmsRotateConfigState.ts

import { useState, useCallback } from 'react';
import type { SmsRotateConfig, SmsRotateSetup } from '../../../../shared/types/config';
import { parseSmsRotateConfig, serializeSmsRotateConfig } from '../utils/sms-rotate-parser';

export interface UseSmsRotateConfigStateResult {
  config: SmsRotateConfig;
  isDirty: boolean;

  setPersistIndex: (value: boolean) => void;
  updateDefaultAttribute: (name: string, value: number) => void;

  addRotationEntry: () => void;
  removeRotationEntry: (index: number) => void;
  moveRotationEntry: (index: number, direction: -1 | 1) => void;
  setRotationAttribute: (index: number, name: string, value: number) => void;
  removeRotationAttribute: (index: number, name: string) => void;

  resetConfig: () => void;
  importFromString: (content: string) => { success: boolean; error?: string };
  exportToString: () => string;
  markAsSaved: () => void;
}

const DEFAULT_CONFIG: SmsRotateConfig = {
  version: 7,
  persistIndex: false,
  default: {},
  rotation: [],
};

function withoutKey(setup: SmsRotateSetup, name: string): SmsRotateSetup {
  const next = { ...setup };
  delete next[name];
  return next;
}

export function useSmsRotateConfigState(): UseSmsRotateConfigStateResult {
  const [config, setConfig] = useState<SmsRotateConfig>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<string>(JSON.stringify(DEFAULT_CONFIG));

  const isDirty = JSON.stringify(config) !== originalConfig;

  const setPersistIndex = useCallback((value: boolean) => {
    setConfig(prev => ({ ...prev, persistIndex: value }));
  }, []);

  const updateDefaultAttribute = useCallback((name: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      default: { ...prev.default, [name]: value },
    }));
  }, []);

  const addRotationEntry = useCallback(() => {
    setConfig(prev => ({ ...prev, rotation: [...prev.rotation, {}] }));
  }, []);

  const removeRotationEntry = useCallback((index: number) => {
    setConfig(prev => ({
      ...prev,
      rotation: prev.rotation.filter((_, i) => i !== index),
    }));
  }, []);

  const moveRotationEntry = useCallback((index: number, direction: -1 | 1) => {
    setConfig(prev => {
      const target = index + direction;
      if (target < 0 || target >= prev.rotation.length) return prev;
      const rotation = [...prev.rotation];
      [rotation[index], rotation[target]] = [rotation[target], rotation[index]];
      return { ...prev, rotation };
    });
  }, []);

  const setRotationAttribute = useCallback((index: number, name: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      rotation: prev.rotation.map((entry, i) =>
        i === index ? { ...entry, [name]: value } : entry,
      ),
    }));
  }, []);

  const removeRotationAttribute = useCallback((index: number, name: string) => {
    setConfig(prev => ({
      ...prev,
      rotation: prev.rotation.map((entry, i) =>
        i === index ? withoutKey(entry, name) : entry,
      ),
    }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setOriginalConfig(JSON.stringify(DEFAULT_CONFIG));
  }, []);

  const importFromString = useCallback((content: string): { success: boolean; error?: string } => {
    try {
      const parsed = parseSmsRotateConfig(content);
      setConfig(parsed);
      setOriginalConfig(JSON.stringify(parsed));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to parse config',
      };
    }
  }, []);

  const exportToString = useCallback((): string => {
    return serializeSmsRotateConfig(config);
  }, [config]);

  const markAsSaved = useCallback(() => {
    setOriginalConfig(JSON.stringify(config));
  }, [config]);

  return {
    config,
    isDirty,
    setPersistIndex,
    updateDefaultAttribute,
    addRotationEntry,
    removeRotationEntry,
    moveRotationEntry,
    setRotationAttribute,
    removeRotationAttribute,
    resetConfig,
    importFromString,
    exportToString,
    markAsSaved,
  };
}
