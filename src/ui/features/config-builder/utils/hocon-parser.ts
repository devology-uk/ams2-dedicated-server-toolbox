import type { ServerConfig } from '../../../../shared/types/config';

/**
 * Parse HOCON-style server.cfg content into a JavaScript object
 * 
 * This parser handles the specific format used by AMS2:
 * - Keys and values separated by : or =
 * - Unquoted string values (like: logLevel : info)
 * - Quoted string values (like: name : "My Server")
 * - Nested objects with { }
 * - Arrays with [ ]
 * - Single-line comments with //
 * - Trailing commas allowed
 */
export function parseServerConfig(content: string): ServerConfig {
  return parseHocon(content) as ServerConfig;
}

/**
 * Parse HOCON-style content (see parseServerConfig for the supported syntax)
 * into a plain JavaScript value. Generic entry point reused by any HOCON-ish
 * config file this app reads — not just server.cfg.
 */
export function parseHocon(content: string): unknown {
  // Remove comments
  const lines = content.split('\n');
  const cleanedLines: string[] = [];

  for (const line of lines) {
    // Remove single-line comments, but be careful not to remove // inside strings
    let inString = false;
    let commentStart = -1;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inString = !inString;
      }

      if (!inString && char === '/' && nextChar === '/') {
        commentStart = i;
        break;
      }
    }

    if (commentStart >= 0) {
      cleanedLines.push(line.substring(0, commentStart));
    } else {
      cleanedLines.push(line);
    }
  }

  const cleaned = cleanedLines.join('\n');

  // Parse the content recursively
  const result = parseObject(cleaned.trim(), 0);
  return result.value;
}

interface ParseResult {
  value: unknown;
  endIndex: number;
}

function parseObject(content: string, startIndex: number): ParseResult {
  const obj: Record<string, unknown> = {};
  let i = startIndex;
  
  // Skip leading whitespace and opening brace if present
  while (i < content.length && /\s/.test(content[i])) i++;
  if (content[i] === '{') i++;
  
  while (i < content.length) {
    // Skip whitespace and commas
    while (i < content.length && /[\s,]/.test(content[i])) i++;
    
    // Check for end of object
    if (content[i] === '}' || i >= content.length) {
      return { value: obj, endIndex: i + 1 };
    }
    
    // Parse key
    const keyResult = parseKey(content, i);
    if (!keyResult) break;
    
    const key = keyResult.key;
    i = keyResult.endIndex;
    
    // Skip whitespace and colon/equals
    while (i < content.length && /[\s:=]/.test(content[i])) i++;
    
    // Parse value
    const valueResult = parseValue(content, i);
    obj[key] = valueResult.value;
    i = valueResult.endIndex;
  }
  
  return { value: obj, endIndex: i };
}

function parseKey(content: string, startIndex: number): { key: string; endIndex: number } | null {
  let i = startIndex;
  
  // Skip whitespace
  while (i < content.length && /\s/.test(content[i])) i++;
  
  if (i >= content.length) return null;
  
  // Check if key is quoted
  if (content[i] === '"') {
    i++; // Skip opening quote
    const keyStart = i;
    while (i < content.length && content[i] !== '"') i++;
    const key = content.substring(keyStart, i);
    i++; // Skip closing quote
    return { key, endIndex: i };
  }
  
  // Unquoted key - read until : or = or whitespace
  const keyStart = i;
  while (i < content.length && !/[\s:=]/.test(content[i])) i++;
  const key = content.substring(keyStart, i);
  
  if (key.length === 0) return null;
  
  return { key, endIndex: i };
}

function parseValue(content: string, startIndex: number): ParseResult {
  let i = startIndex;
  
  // Skip whitespace
  while (i < content.length && /\s/.test(content[i])) i++;
  
  if (i >= content.length) {
    return { value: null, endIndex: i };
  }
  
  const char = content[i];
  
  // Object
  if (char === '{') {
    return parseObject(content, i);
  }
  
  // Array
  if (char === '[') {
    return parseArray(content, i);
  }
  
  // Quoted string
  if (char === '"') {
    return parseQuotedString(content, i);
  }
  
  // Number, boolean, or unquoted string
  return parseUnquotedValue(content, i);
}

function parseArray(content: string, startIndex: number): ParseResult {
  const arr: unknown[] = [];
  let i = startIndex + 1; // Skip opening bracket
  
  while (i < content.length) {
    // Skip whitespace and commas
    while (i < content.length && /[\s,]/.test(content[i])) i++;
    
    // Check for end of array
    if (content[i] === ']') {
      return { value: arr, endIndex: i + 1 };
    }
    
    // Parse value
    const valueResult = parseValue(content, i);
    arr.push(valueResult.value);
    i = valueResult.endIndex;
  }
  
  return { value: arr, endIndex: i };
}

function parseQuotedString(content: string, startIndex: number): ParseResult {
  let i = startIndex + 1; // Skip opening quote
  let result = '';
  
  while (i < content.length) {
    const char = content[i];
    
    if (char === '\\' && i + 1 < content.length) {
      // Escape sequence
      const nextChar = content[i + 1];
      switch (nextChar) {
        case 'n': result += '\n'; break;
        case 't': result += '\t'; break;
        case 'r': result += '\r'; break;
        case '"': result += '"'; break;
        case '\\': result += '\\'; break;
        default: result += nextChar;
      }
      i += 2;
    } else if (char === '"') {
      // End of string
      return { value: result, endIndex: i + 1 };
    } else {
      result += char;
      i++;
    }
  }
  
  return { value: result, endIndex: i };
}

function parseUnquotedValue(content: string, startIndex: number): ParseResult {
  let i = startIndex;
  
  // Read until we hit a delimiter: whitespace, comma, }, ], or newline followed by a key
  const valueStart = i;
  
  while (i < content.length) {
    const char = content[i];
    
    // Stop at obvious delimiters
    if (char === ',' || char === '}' || char === ']') {
      break;
    }
    
    // Stop at newline if next non-whitespace looks like a key or closing brace
    if (char === '\n') {
      let j = i + 1;
      while (j < content.length && content[j] === ' ') j++;
      const nextChar = content[j];
      if (nextChar === '}' || nextChar === ']' || /[a-zA-Z"_]/.test(nextChar)) {
        break;
      }
    }
    
    i++;
  }
  
  const rawValue = content.substring(valueStart, i).trim();
  
  // Convert to appropriate type
  if (rawValue === 'true') return { value: true, endIndex: i };
  if (rawValue === 'false') return { value: false, endIndex: i };
  if (rawValue === 'null') return { value: null, endIndex: i };
  
  // Try to parse as number, but keep large integers as strings to avoid precision loss
  // (e.g. Steam IDs like 76561197994111033 exceed Number.MAX_SAFE_INTEGER)
  if (/^-?\d+(\.\d+)?$/.test(rawValue)) {
    const num = Number(rawValue);
    if (Number.isSafeInteger(num) && !rawValue.includes('.')) {
      return { value: num, endIndex: i };
    }
    if (rawValue.includes('.') && !isNaN(num)) {
      return { value: num, endIndex: i };
    }
    // Large integer — keep as string to preserve precision
    return { value: rawValue, endIndex: i };
  }
  const num = Number(rawValue);
  if (!isNaN(num) && rawValue !== '') {
    return { value: num, endIndex: i };
  }
  
  // Return as string
  return { value: rawValue, endIndex: i };
}

/**
 * Serialize a plain JavaScript value to HOCON-style text (see parseHocon for
 * the supported syntax). Generic entry point reused by any HOCON-ish config
 * file this app writes — not just server.cfg.
 */
export function serializeHoconValue(value: unknown, indent = 0): string {
  const indentStr = '    '.repeat(indent);

  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'string') {
    // Check if string needs quoting (contains special chars or spaces)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value) && !['true', 'false', 'null'].includes(value)) {
      return value; // Can be unquoted
    }
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(item => `${indentStr}    ${serializeHoconValue(item, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${indentStr}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';

    const props = entries.map(([k, v]) => {
      const serializedValue = serializeHoconValue(v, indent + 1);
      const needsQuotes = /[^a-zA-Z0-9_*]/.test(k);
      const quotedKey = needsQuotes ? `"${k}"` : k;
      return `${indentStr}    ${quotedKey} : ${serializedValue}`;
    });

    return `{\n${props.join('\n')}\n${indentStr}}`;
  }

  return String(value);
}

/**
 * Serialize a ServerConfig object to HOCON-style server.cfg format
 */
export function serializeServerConfig(config: ServerConfig): string {
  const lines: string[] = [];
  const serializeValue = serializeHoconValue;

  // Skip HOCON dummy comment keys (e.g. "//" : "comment text")
  const SKIP_KEYS = new Set(['//', 'rem', '#']);

  // Property order for readability
  const orderedKeys: string[] = [
    'logLevel', 'eventsLogSize', 'name', 'secure', 'password', 'maxPlayerCount',
    'bindIP', 'steamPort', 'hostPort', 'queryPort',
    'sleepWaiting', 'sleepActive', 'sportsPlay',
    'blackList', 'whiteList',
    'enableHttpApi', 'httpApiLogLevel', 'httpApiInterface', 'httpApiPort',
    'httpApiExtraHeaders', 'httpApiAccessLevels', 'httpApiAccessFilters',
    'httpApiUsers', 'httpApiGroups', 'staticWebFiles',
    'enableLuaApi', 'luaAddonRoot', 'luaConfigRoot', 'luaOutputRoot',
    'luaApiAddons', 'luaAllowedLibraries',
    'allowEmptyJoin', 'controlGameSetup',
    'sessionAttributes',
  ];
  
  // Sort addon names: sms_base first, other sms_* next, then everything else, ams2_stats last
  const sortAddons = (addons: string[]): string[] => {
    const bucket = (name: string): number => {
      if (name === 'sms_base' || name === 'lib_rotate') return 0;
      if (name.startsWith('sms_')) return 1;
      if (name === 'ams2_stats') return 3;
      return 2;
    };
    return [...addons].sort((a, b) => bucket(a) - bucket(b));
  };

  const written = new Set<string>();

  for (const key of orderedKeys) {
    let value = (config as Record<string, unknown>)[key];
    if (value !== undefined && !SKIP_KEYS.has(key)) {
      if (key === 'luaApiAddons' && Array.isArray(value)) {
        value = sortAddons(value as string[]);
      }
      const serialized = serializeValue(value, 0);
      lines.push(`${key} : ${serialized}`);
      written.add(key);
    }
  }

  // Write any remaining keys not in the ordered list (skip dummy comment keys)
  for (const [key, value] of Object.entries(config)) {
    if (!written.has(key) && !SKIP_KEYS.has(key) && value !== undefined) {
      const serialized = serializeValue(value, 0);
      lines.push(`${key} : ${serialized}`);
    }
  }
  
  return lines.join('\n');
}