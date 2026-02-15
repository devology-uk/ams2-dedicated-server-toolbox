// src/ui/features/config-builder/components/LuaApiForm.tsx

import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Chips } from 'primereact/chips';
import { Panel } from 'primereact/panel';
import type { ServerConfig } from '../../../../shared/types/config';

interface LuaApiFormProps {
  config: ServerConfig;
  onChange: <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => void;
}

export const LuaApiForm = ({
  config,
  onChange,
}: LuaApiFormProps) => {
  return (
    <div className="lua-api-form">
      {/* Lua API Settings */}
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

      {/* Addons */}
      {config.enableLuaApi && (
        <>
          <Panel header="Addons" toggleable className="mb-3">
            <p className="text-color-secondary mb-3">
              Lua addons to load, in order. Each addon can list dependencies which are loaded first.
            </p>
            <Chips
              id="luaApiAddons"
              value={config.luaApiAddons ?? []}
              onChange={(e) => onChange('luaApiAddons', e.value ?? [])}
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
