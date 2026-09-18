// src/ui/features/config-builder/components/LuaApiForm.tsx

import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Chips } from 'primereact/chips';
import { Panel } from 'primereact/panel';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import type { ServerConfig } from '../../../../shared/types/config';
import {
    KNOWN_PLUGINS,
    isKnownAddon,
    enableAddon,
    disableAddon,
    setCustomAddons as reorderCustomAddons,
    DEFAULT_LUA_ADDON_ROOT,
    DEFAULT_LUA_CONFIG_ROOT,
    DEFAULT_LUA_OUTPUT_ROOT,
} from '../utils/lua-addons';

interface LuaApiFormProps {
    config: ServerConfig;
    onChange: <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => void;
    onOpenPluginsInstaller?: () => void;
    onOpenSmsRotateConfig?: () => void;
}

export const LuaApiForm = ({
    config,
    onChange,
    onOpenPluginsInstaller,
    onOpenSmsRotateConfig,
}: LuaApiFormProps) => {
    const addons = config.luaApiAddons ?? [];

    const isEnabled = (addonName: string) => addons.includes(addonName);

    const toggleAddon = (addonName: string, enabled: boolean) => {
        onChange('luaApiAddons', enabled ? enableAddon(addons, addonName) : disableAddon(addons, addonName));
    };

    // Root fields show placeholder text when empty, which reads like a real value at a glance —
    // fill them with the actual defaults on enable so an unedited config still exports correctly.
    const toggleLuaApi = (enabled: boolean) => {
        onChange('enableLuaApi', enabled);
        if (enabled) {
            if (!config.luaAddonRoot) onChange('luaAddonRoot', DEFAULT_LUA_ADDON_ROOT);
            if (!config.luaConfigRoot) onChange('luaConfigRoot', DEFAULT_LUA_CONFIG_ROOT);
            if (!config.luaOutputRoot) onChange('luaOutputRoot', DEFAULT_LUA_OUTPUT_ROOT);
        }
    };

    const customAddons = addons.filter((a) => !isKnownAddon(a));

    const setCustomAddons = (next: string[]) => {
        onChange('luaApiAddons', reorderCustomAddons(addons, next));
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
                                onChange={(e) => toggleLuaApi(e.value)}
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
                                        {plugin.configurable && onOpenSmsRotateConfig && (
                                            <Button
                                                label="Configure"
                                                icon="pi pi-sliders-h"
                                                size="small"
                                                outlined
                                                severity="secondary"
                                                onClick={onOpenSmsRotateConfig}
                                                tooltip="Open the SMS Rotate configuration page"
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
