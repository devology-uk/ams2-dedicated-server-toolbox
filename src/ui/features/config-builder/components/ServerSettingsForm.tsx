// src/ui/features/config-builder/components/ServerSettingsForm.tsx

import React from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Panel } from 'primereact/panel';
import type { ServerConfig } from '../../../../shared/types/config';

interface ServerSettingsFormProps {
  config: ServerConfig;
  onChange: <K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => void;
}

const LOG_LEVELS = [
  { label: 'Debug', value: 'debug' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
];

export const ServerSettingsForm: React.FC<ServerSettingsFormProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="server-settings-form">
      {/* Basic Server Settings */}
      <Panel header="Basic Settings" toggleable className="mb-3">
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="name" className="block font-medium mb-2">
                Server Name
              </label>
              <InputText
                id="name"
                value={config.name ?? ''}
                onChange={(e) => onChange('name', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="password" className="block font-medium mb-2">
                Password
              </label>
              <InputText
                id="password"
                value={config.password ?? ''}
                onChange={(e) => onChange('password', e.target.value)}
                className="w-full"
                type="password"
              />
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="maxPlayerCount" className="block font-medium mb-2">
                Max Players
              </label>
              <InputNumber
                id="maxPlayerCount"
                value={config.maxPlayerCount ?? 20}
                onValueChange={(e) => onChange('maxPlayerCount', e.value ?? 20)}
                min={1}
                max={32}
                showButtons
                className="w-full"
              />
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="logLevel" className="block font-medium mb-2">
                Log Level
              </label>
              <Dropdown
                id="logLevel"
                value={config.logLevel ?? 'info'}
                options={LOG_LEVELS}
                onChange={(e) => onChange('logLevel', e.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="eventsLogSize" className="block font-medium mb-2">
                Events Log Size
              </label>
              <InputNumber
                id="eventsLogSize"
                value={config.eventsLogSize ?? 10000}
                onValueChange={(e) => onChange('eventsLogSize', e.value ?? 10000)}
                min={100}
                max={100000}
                showButtons
                className="w-full"
              />
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field flex align-items-center gap-3 mt-4">
              <InputSwitch
                id="secure"
                checked={config.secure ?? false}
                onChange={(e) => onChange('secure', e.value)}
              />
              <label htmlFor="secure">Secure Mode</label>
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field flex align-items-center gap-3 mt-4">
              <InputSwitch
                id="sportsPlay"
                checked={config.sportsPlay ?? false}
                onChange={(e) => onChange('sportsPlay', e.value)}
              />
              <label htmlFor="sportsPlay">Sports Play</label>
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field flex align-items-center gap-3 mt-4">
              <InputSwitch
                id="allowEmptyJoin"
                checked={config.allowEmptyJoin ?? true}
                onChange={(e) => onChange('allowEmptyJoin', e.value)}
              />
              <label htmlFor="allowEmptyJoin">Allow Empty Join</label>
            </div>
          </div>
        </div>
      </Panel>

      {/* Network Settings */}
      <Panel header="Network Settings" toggleable className="mb-3">
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="bindIP" className="block font-medium mb-2">
                Bind IP Address
              </label>
              <InputText
                id="bindIP"
                value={config.bindIP ?? ''}
                onChange={(e) => onChange('bindIP', e.target.value)}
                className="w-full"
                placeholder="0.0.0.0"
              />
            </div>
          </div>

          <div className="col-12 md:col-6">
            {/* Empty for spacing */}
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="steamPort" className="block font-medium mb-2">
                Steam Port
              </label>
              <InputNumber
                id="steamPort"
                value={config.steamPort ?? 27015}
                onValueChange={(e) => onChange('steamPort', e.value ?? 27015)}
                min={1024}
                max={65535}
                useGrouping={false}
                className="w-full"
              />
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="hostPort" className="block font-medium mb-2">
                Host Port
              </label>
              <InputNumber
                id="hostPort"
                value={config.hostPort ?? 27016}
                onValueChange={(e) => onChange('hostPort', e.value ?? 27016)}
                min={1024}
                max={65535}
                useGrouping={false}
                className="w-full"
              />
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="queryPort" className="block font-medium mb-2">
                Query Port
              </label>
              <InputNumber
                id="queryPort"
                value={config.queryPort ?? 27017}
                onValueChange={(e) => onChange('queryPort', e.value ?? 27017)}
                min={1024}
                max={65535}
                useGrouping={false}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* HTTP API Settings */}
      <Panel header="HTTP API Settings" toggleable className="mb-3">
        <div className="grid">
          <div className="col-12 md:col-4">
            <div className="field flex align-items-center gap-3">
              <InputSwitch
                id="enableHttpApi"
                checked={config.enableHttpApi ?? false}
                onChange={(e) => onChange('enableHttpApi', e.value)}
              />
              <label htmlFor="enableHttpApi">Enable HTTP API</label>
            </div>
          </div>

          {config.enableHttpApi && (
            <>
              <div className="col-12 md:col-4">
                <div className="field">
                  <label htmlFor="httpApiInterface" className="block font-medium mb-2">
                    API Interface
                  </label>
                  <InputText
                    id="httpApiInterface"
                    value={config.httpApiInterface ?? ''}
                    onChange={(e) => onChange('httpApiInterface', e.target.value)}
                    className="w-full"
                    placeholder="0.0.0.0"
                  />
                </div>
              </div>

              <div className="col-12 md:col-4">
                <div className="field">
                  <label htmlFor="httpApiPort" className="block font-medium mb-2">
                    API Port
                  </label>
                  <InputNumber
                    id="httpApiPort"
                    value={config.httpApiPort ?? 9000}
                    onValueChange={(e) => onChange('httpApiPort', e.value ?? 9000)}
                    min={1024}
                    max={65535}
                    useGrouping={false}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-4">
                <div className="field">
                  <label htmlFor="httpApiLogLevel" className="block font-medium mb-2">
                    API Log Level
                  </label>
                  <Dropdown
                    id="httpApiLogLevel"
                    value={config.httpApiLogLevel ?? 'warning'}
                    options={LOG_LEVELS}
                    onChange={(e) => onChange('httpApiLogLevel', e.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12 md:col-8">
                <div className="field">
                  <label htmlFor="staticWebFiles" className="block font-medium mb-2">
                    Static Web Files Path
                  </label>
                  <InputText
                    id="staticWebFiles"
                    value={config.staticWebFiles ?? ''}
                    onChange={(e) => onChange('staticWebFiles', e.target.value)}
                    className="w-full"
                    placeholder="web_files"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* Lua API Settings */}
      <Panel header="Lua API Settings" toggleable className="mb-3">
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
                    Lua Addon Root
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
                    Lua Config Root
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
                    Lua Output Root
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
    </div>
  );
};