// src/ui/features/config-builder/components/LuaApiForm.tsx

import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Chips } from 'primereact/chips';
import { Panel } from 'primereact/panel';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import type { ServerConfig } from '../../../../shared/types/config';

interface LuaApiFormProps {
    config: ServerConfig;
    onChange: <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => void;
    onOpenPluginsInstaller?: () => void;
}

interface KnownPluginEntry {
    addonName: string;
    label: string;
    description: string;
    bundled: boolean;
    dependsOn?: string[];  // other known addon names this plugin requires
    loadLast?: boolean;    // always placed after all other addons in the list
}

// Order here defines load order. loadLast plugins are pinned to the end.
const KNOWN_PLUGINS: KnownPluginEntry[] = [
    {
        addonName: 'sms_base',
        label: 'SMS Base',
        description: 'Base library required by the sms_stats plugin. Must be loaded first.',
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
        addonName: 'ams2_stats',
        label: 'AMS2 Stats',
        description: 'Enhanced race statistics with sector times and complete results for all drivers.',
        bundled: true,
        loadLast: true,
    },
];

export const LuaApiForm = ({
    config,
    onChange,
    onOpenPluginsInstaller,
}: LuaApiFormProps) => {
    const addons = config.luaApiAddons ?? [];

    const knownAddonNames = new Set(KNOWN_PLUGINS.map((p) => p.addonName));
    const isEnabled = (addonName: string) => addons.includes(addonName);

    // Rebuild the addons list in canonical order:
    // non-loadLast known plugins (in KNOWN_PLUGINS order) → custom addons → loadLast plugins
    const buildOrdered = (enabledKnown: Set<string>, custom: string[]): string[] => {
        const normal = KNOWN_PLUGINS
            .filter((p) => !p.loadLast && enabledKnown.has(p.addonName))
            .map((p) => p.addonName);
        const last = KNOWN_PLUGINS
            .filter((p) => p.loadLast && enabledKnown.has(p.addonName))
            .map((p) => p.addonName);
        return [...normal, ...custom, ...last];
    };

    const toggleAddon = (addonName: string, enabled: boolean) => {
        const enabledKnown = new Set(addons.filter((a) => knownAddonNames.has(a)));
        if (enabled) {
            enabledKnown.add(addonName);
            // Auto-enable dependencies
            for (const dep of KNOWN_PLUGINS.find((p) => p.addonName === addonName)?.dependsOn ?? []) {
                enabledKnown.add(dep);
            }
        } else {
            enabledKnown.delete(addonName);
            // Auto-disable anything that depends on this addon
            for (const p of KNOWN_PLUGINS) {
                if (p.dependsOn?.includes(addonName)) enabledKnown.delete(p.addonName);
            }
        }
        const custom = addons.filter((a) => !knownAddonNames.has(a));
        onChange('luaApiAddons', buildOrdered(enabledKnown, custom));
    };

    const customAddons = addons.filter((a) => !knownAddonNames.has(a));

    const setCustomAddons = (next: string[]) => {
        const enabledKnown = new Set(addons.filter((a) => knownAddonNames.has(a)));
        onChange('luaApiAddons', buildOrdered(enabledKnown, next));
    };

    return (
        <div className="lua-api-form">
            <Panel header="Lua Settings" toggleable className="mb-3">
                <div className="grid">
                    <div className="col-12 md:col-4">
                        <div className="field flex align-items-center gap-3">
                            <InputSwitch
                                id="enableLuaApi"
                                checked={config.enableLuaApi ?? false}
                                onChange={(e) => onChange('enableLuaApi', e.value)}
                            />
                            <label htmlFor="enableLuaApi">Enable Lua API</label>
                        </div>
                    </div>

                    {config.enableLuaApi && (
                        <>
                            <div className="col-12 md:col-4">
                                <div className="field">
                                    <label htmlFor="luaAddonRoot" className="block font-medium mb-2">
                                        Addon Root
                                    </label>
                                    <InputText
                                        id="luaAddonRoot"
                                        value={config.luaAddonRoot ?? ''}
                                        onChange={(e) => onChange('luaAddonRoot', e.target.value)}
                                        className="w-full"
                                        placeholder="lua"
                                    />
                                </div>
                            </div>

                            <div className="col-12 md:col-4">
                                <div className="field">
                                    <label htmlFor="luaConfigRoot" className="block font-medium mb-2">
                                        Config Root
                                    </label>
                                    <InputText
                                        id="luaConfigRoot"
                                        value={config.luaConfigRoot ?? ''}
                                        onChange={(e) => onChange('luaConfigRoot', e.target.value)}
                                        className="w-full"
                                        placeholder="lua_config"
                                    />
                                </div>
                            </div>

                            <div className="col-12 md:col-4">
                                <div className="field">
                                    <label htmlFor="luaOutputRoot" className="block font-medium mb-2">
                                        Output Root
                                    </label>
                                    <InputText
                                        id="luaOutputRoot"
                                        value={config.luaOutputRoot ?? ''}
                                        onChange={(e) => onChange('luaOutputRoot', e.target.value)}
                                        className="w-full"
                                        placeholder="lua_output"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Panel>

            {config.enableLuaApi && (
                <>
                    {/* Known plugins */}
                    <Panel header="Known Plugins" toggleable className="mb-3">
                        <p className="text-color-secondary mt-0 mb-3">
                            Toggle known plugins on or off. Enabled plugins are added to the addons load list.
                        </p>
                        <div className="flex flex-column gap-2">
                            {KNOWN_PLUGINS.map((plugin) => {
                                const enabled = isEnabled(plugin.addonName);
                                // This plugin is required by another enabled plugin
                                const forcedBy = KNOWN_PLUGINS.find(
                                    (p) => isEnabled(p.addonName) && p.dependsOn?.includes(plugin.addonName),
                                );
                                return (
                                    <div
                                        key={plugin.addonName}
                                        className="flex align-items-center gap-3 p-3 border-1 border-round surface-border"
                                    >
                                        <InputSwitch
                                            checked={enabled}
                                            onChange={(e) => toggleAddon(plugin.addonName, e.value)}
                                        />
                                        <div className="flex-grow-1">
                                            <div className="flex align-items-center gap-2 mb-1">
                                                <span className="font-semibold">{plugin.label}</span>
                                                <Tag
                                                    value={`addon: ${plugin.addonName}`}
                                                    severity="secondary"
                                                    className="text-xs font-mono"
                                                />
                                                {plugin.bundled && (
                                                    <Tag value="Bundled" severity="success" className="text-xs" />
                                                )}
                                                {forcedBy && (
                                                    <Tag
                                                        value={`required by ${forcedBy.addonName}`}
                                                        severity="warning"
                                                        className="text-xs"
                                                    />
                                                )}
                                            </div>
                                            <p className="m-0 text-sm text-color-secondary">
                                                {plugin.description}
                                            </p>
                                        </div>
                                        {plugin.bundled && onOpenPluginsInstaller && (
                                            <Button
                                                label="Install"
                                                icon="pi pi-download"
                                                size="small"
                                                outlined
                                                severity="secondary"
                                                onClick={onOpenPluginsInstaller}
                                                tooltip="Open the Plugin Installer to copy files to your server folder"
                                                tooltipOptions={{ position: 'left' }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Panel>

                    {/* Custom / unknown addons */}
                    <Panel header="Custom Addons" toggleable className="mb-3">
                        <p className="text-color-secondary mb-3">
                            Add any other addon names not listed above. Each addon is loaded in order after known plugins.
                        </p>
                        <Chips
                            id="luaApiAddonsCustom"
                            value={customAddons}
                            onChange={(e) => setCustomAddons(e.value ?? [])}
                            className="w-full"
                            placeholder="Type addon name and press Enter"
                        />
                    </Panel>

                    <Panel header="Allowed Libraries" toggleable className="mb-3">
                        <p className="text-color-secondary mb-3">
                            Lua libraries that addons are allowed to use.
                        </p>
                        <Chips
                            id="luaAllowedLibraries"
                            value={config.luaAllowedLibraries ?? []}
                            onChange={(e) => onChange('luaAllowedLibraries', e.value ?? [])}
                            className="w-full"
                            placeholder="Type library name and press Enter"
                        />
                    </Panel>
                </>
            )}
        </div>
    );
};
