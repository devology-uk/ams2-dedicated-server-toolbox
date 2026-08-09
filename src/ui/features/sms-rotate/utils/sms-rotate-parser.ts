import type { SmsRotateConfig, SmsRotateSetup } from '../../../../shared/types/config';
import { parseHocon, serializeHoconValue } from '../../config-builder/utils/hocon-parser';

const DEFAULT_VERSION = 7;

/**
 * Parse the contents of a sms_rotate_config.json file (HOCON-with-comments,
 * same format as server.cfg) into a SmsRotateConfig.
 */
export function parseSmsRotateConfig(content: string): SmsRotateConfig {
  const parsed = parseHocon(content) as {
    version?: number;
    config?: {
      persist_index?: boolean;
      default?: SmsRotateSetup;
      rotation?: SmsRotateSetup[];
    };
  };

  const config = parsed.config ?? {};

  return {
    version: parsed.version ?? DEFAULT_VERSION,
    persistIndex: config.persist_index ?? false,
    default: config.default ?? {},
    rotation: config.rotation ?? [],
  };
}

/**
 * Serialize a SmsRotateConfig back to the HOCON-with-comments shape the
 * sms_rotate plugin reads from lua_config/sms_rotate_config.json.
 */
export function serializeSmsRotateConfig(config: SmsRotateConfig): string {
  const body = {
    persist_index: config.persistIndex,
    default: config.default,
    rotation: config.rotation,
  };

  return [
    `version : ${config.version}`,
    `config : ${serializeHoconValue(body, 0)}`,
  ].join('\n');
}
