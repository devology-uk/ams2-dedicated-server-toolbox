// src/ui/features/config-builder/utils/lua-addons.ts

import type { ServerConfig } from '../../../../shared/types/config';

// Root paths the AMS2 dedicated server expects when Lua is enabled (see config_sample/*.cfg).
export const DEFAULT_LUA_ADDON_ROOT = 'lua';
export const DEFAULT_LUA_CONFIG_ROOT = 'lua_config';
export const DEFAULT_LUA_OUTPUT_ROOT = 'lua_output';

// Backfills the standard Lua root paths onto a config that has the Lua API enabled but is
// missing one or more of them — e.g. a config saved before these defaults existed, or a
// hand-edited/imported file. Leaves everything else untouched.
export function withLuaRootDefaults(config: ServerConfig): ServerConfig {
    if (!config.enableLuaApi) return config;
    if (config.luaAddonRoot && config.luaConfigRoot && config.luaOutputRoot) return config;
    return {
        ...config,
        luaAddonRoot: config.luaAddonRoot || DEFAULT_LUA_ADDON_ROOT,
        luaConfigRoot: config.luaConfigRoot || DEFAULT_LUA_CONFIG_ROOT,
        luaOutputRoot: config.luaOutputRoot || DEFAULT_LUA_OUTPUT_ROOT,
    };
}

export interface KnownPluginEntry {
    addonName: string;
    label: string;
    description: string;
    bundled: boolean;
    dependsOn?: string[];  // other known addon names this plugin requires
    loadLast?: boolean;    // always placed after all other addons in the list
    configurable?: boolean; // has its own dedicated configuration page (see onOpenSmsRotateConfig)
}

// Order here defines load order. loadLast plugins are pinned to the end.
export const KNOWN_PLUGINS: KnownPluginEntry[] = [
    {
        addonName: 'sms_base',
        label: 'SMS Base',
        description: 'Base library required by the sms_stats and sms_rotate plugins. Must be loaded first.',
        bundled: false,
    },
    {
        addonName: 'sms_stats',
        label: 'SMS Stats',
        description: 'Built-in race statistics plugin. Automatically enables sms_base.',
        bundled: false,
        dependsOn: ['sms_base'],
    },
    {
        addonName: 'lib_rotate',
        label: 'Lib Rotate',
        description: 'Setup-merging helper library required by SMS Rotate. Automatically enables sms_base.',
        bundled: false,
        dependsOn: ['sms_base'],
    },
    {
        addonName: 'sms_rotate',
        label: 'SMS Rotate',
        description: 'Rotates the server through a list of track/vehicle/session setups. Automatically enables lib_rotate and sms_base.',
        bundled: false,
        dependsOn: ['lib_rotate'],
        configurable: true,
    },
    {
        addonName: 'ams2_stats',
        label: 'AMS2 Stats',
        description: 'Enhanced race statistics with sector times and complete results for all drivers.',
        bundled: true,
        loadLast: true,
    },
];

const pluginByName = new Map(KNOWN_PLUGINS.map((p) => [p.addonName, p]));
const knownAddonNames = new Set(KNOWN_PLUGINS.map((p) => p.addonName));

export function isKnownAddon(addonName: string): boolean {
    return knownAddonNames.has(addonName);
}

// Walks dependsOn transitively, adding every required addon to `into`.
function resolveDependenciesInto(addonName: string, into: Set<string>): void {
    for (const dep of pluginByName.get(addonName)?.dependsOn ?? []) {
        if (!into.has(dep)) {
            into.add(dep);
            resolveDependenciesInto(dep, into);
        }
    }
}

// Removes addonName and anything that (transitively) depends on it.
function removeWithDependents(addonName: string, from: Set<string>): void {
    if (!from.delete(addonName)) return;
    for (const plugin of KNOWN_PLUGINS) {
        if (plugin.dependsOn?.includes(addonName)) {
            removeWithDependents(plugin.addonName, from);
        }
    }
}

// Rebuilds the full addon list in canonical order:
// non-loadLast known plugins (KNOWN_PLUGINS order, with dependencies resolved) → custom addons → loadLast known plugins.
// Because sms_base is declared first and every sms_* plugin depends on it (directly or
// transitively), it always sorts ahead of any other enabled sms_* addon.
function buildOrderedAddons(enabledKnown: Set<string>, custom: string[]): string[] {
    const resolved = new Set(enabledKnown);
    for (const name of enabledKnown) resolveDependenciesInto(name, resolved);

    const normal = KNOWN_PLUGINS.filter((p) => !p.loadLast && resolved.has(p.addonName)).map((p) => p.addonName);
    const last = KNOWN_PLUGINS.filter((p) => p.loadLast && resolved.has(p.addonName)).map((p) => p.addonName);
    return [...normal, ...custom, ...last];
}

export function enableAddon(addons: string[], addonName: string): string[] {
    const enabledKnown = new Set(addons.filter(isKnownAddon));
    enabledKnown.add(addonName);
    const custom = addons.filter((a) => !isKnownAddon(a));
    return buildOrderedAddons(enabledKnown, custom);
}

export function disableAddon(addons: string[], addonName: string): string[] {
    const enabledKnown = new Set(addons.filter(isKnownAddon));
    removeWithDependents(addonName, enabledKnown);
    const custom = addons.filter((a) => !isKnownAddon(a));
    return buildOrderedAddons(enabledKnown, custom);
}

// Custom-addon entries that happen to match a known addon name are promoted
// to known plugins (so they pick up dependency resolution) rather than left as free text.
export function setCustomAddons(addons: string[], custom: string[]): string[] {
    const enabledKnown = new Set(addons.filter(isKnownAddon));
    const trueCustom: string[] = [];
    for (const name of custom) {
        if (isKnownAddon(name)) enabledKnown.add(name);
        else trueCustom.push(name);
    }
    return buildOrderedAddons(enabledKnown, trueCustom);
}

// Normalizes an arbitrary addon list (e.g. one just loaded from an imported file) into
// canonical order, auto-enabling any missing dependencies of known addons present.
// Returns the normalized list plus any dependency addon names that had to be added.
export function normalizeAddonList(addons: string[]): { addons: string[]; addedDependencies: string[] } {
    const enabledKnown = new Set(addons.filter(isKnownAddon));
    const custom = addons.filter((a) => !isKnownAddon(a));
    const normalized = buildOrderedAddons(enabledKnown, custom);
    const addedDependencies = normalized.filter((a) => isKnownAddon(a) && !addons.includes(a));
    return { addons: normalized, addedDependencies };
}

export interface MissingDependency {
    addonName: string;
    missing: string[];
}

// Safety net for config-validation: reports any known addon whose direct dependency
// isn't present in the list, e.g. a hand-edited or externally authored config.
export function findMissingDependencies(addons: string[]): MissingDependency[] {
    const present = new Set(addons);
    const issues: MissingDependency[] = [];
    for (const plugin of KNOWN_PLUGINS) {
        if (!present.has(plugin.addonName) || !plugin.dependsOn) continue;
        const missing = plugin.dependsOn.filter((dep) => !present.has(dep));
        if (missing.length > 0) issues.push({ addonName: plugin.addonName, missing });
    }
    return issues;
}
