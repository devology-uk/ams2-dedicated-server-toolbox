// src/ui/features/config-builder/hooks/useFieldSchema.ts

import { useMemo } from 'react';
import type {
  FieldMetadata,
  ResolvedField,
  FieldGroup,
} from '../types/config-builder.types';
import {
  processAttributeSchema,
  groupFieldsByCategory,
  getCategoryIcon,
} from '../utils/schema-processor';
import { useServerCache } from './useServerCache';

export interface UseFieldSchemaResult {
  fields: FieldMetadata[];
  resolvedFields: ResolvedField[];
  fieldGroups: FieldGroup[];
  isLoading: boolean;
  error: string | null;
}

export function useFieldSchema(connectionId: string | null): UseFieldSchemaResult {
  const {
    isLoading,
    error,
    getSessionAttributes,
    getEnum,
    getFlags,
  } = useServerCache(connectionId);

  // Process raw attributes into field metadata
  const fields = useMemo(() => {
    const attributes = getSessionAttributes();
    return processAttributeSchema(attributes);
  }, [getSessionAttributes]);

  // Resolve fields with their enum/flag options
  const resolvedFields = useMemo((): ResolvedField[] => {
    return fields.map(field => {
      const resolved: ResolvedField = { ...field };

      if (field.enumEndpoint) {
        resolved.enumOptions = getEnum(field.enumEndpoint);
      }

      if (field.flagsEndpoint) {
        resolved.flagOptions = getFlags(field.flagsEndpoint);
      }

      return resolved;
    });
  }, [fields, getEnum, getFlags]);

  // Group fields by category
  const fieldGroups = useMemo((): FieldGroup[] => {
    const grouped = groupFieldsByCategory(resolvedFields);
    const groups: FieldGroup[] = [];

    for (const [category, categoryFields] of grouped) {
      groups.push({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        label: category,
        icon: getCategoryIcon(category),
        fields: categoryFields as ResolvedField[],
      });
    }

    return groups;
  }, [resolvedFields]);

  return {
    fields,
    resolvedFields,
    fieldGroups,
    isLoading,
    error,
  };
}