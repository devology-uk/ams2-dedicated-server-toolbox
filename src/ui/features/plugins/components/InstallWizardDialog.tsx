// src/ui/features/plugins/components/InstallWizardDialog.tsx

import { useState, useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Steps } from 'primereact/steps';
import type { KnownPlugin, PluginInstallResult } from '../../../../shared/types/api';
import './InstallWizardDialog.scss';

interface InstallWizardDialogProps {
    plugin: KnownPlugin | null;
    onHide: () => void;
    onOpenConfigBuilder: () => void;
}

const STEPS = [
    { label: 'About' },
    { label: 'Select Folder' },
    { label: 'Install' },
    { label: 'Configure' },
];

// Files the installer copies, shown in the result step.
const INSTALLED_FILES = [
    'lua/ams2_stats/ams2_stats.lua',
    'lua/ams2_stats/ams2_stats.json',
    'lua/ams2_stats/ams2_stats_default_config.json',
    'lua_config/ams2_stats_config.json',
];

const SERVER_CFG_SNIPPET = `[LUA]
enableLua = 1
luaAddonRoot = lua
luaConfigRoot = lua_config
luaOutputRoot = lua_output
addons = ams2_stats`;

export function InstallWizardDialog({ plugin, onHide, onOpenConfigBuilder }: InstallWizardDialogProps) {
    const [step, setStep] = useState(0);
    const [serverDir, setServerDir] = useState<string | null>(null);
    const [alreadyInstalled, setAlreadyInstalled] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [result, setResult] = useState<PluginInstallResult | null>(null);
    const [copied, setCopied] = useState(false);

    // Reset when a new plugin is opened
    useEffect(() => {
        if (plugin) {
            setStep(0);
            setServerDir(null);
            setAlreadyInstalled(false);
            setInstalling(false);
            setResult(null);
            setCopied(false);
        }
    }, [plugin]);

    const checkInstalled = useCallback(async (dir: string) => {
        if (!plugin) return;
        const installed = await window.electron.plugins.checkInstalled(plugin.id, dir);
        setAlreadyInstalled(installed);
    }, [plugin]);

    const handleSelectFolder = async () => {
        const dir = await window.electron.plugins.selectServerDir();
        if (dir) {
            setServerDir(dir);
            await checkInstalled(dir);
        }
    };

    const handleInstall = async () => {
        if (!plugin || !serverDir) return;
        setInstalling(true);
        const installResult = await window.electron.plugins.install(plugin.id, serverDir);
        setResult(installResult);
        setInstalling(false);
        if (installResult.success) {
            setStep(3);
        }
    };

    const handleCopySnippet = () => {
        navigator.clipboard.writeText(SERVER_CFG_SNIPPET);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const footer = (
        <div className="install-wizard__footer">
            {step > 0 && step < 3 && !installing && (
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    severity="secondary"
                    outlined
                    onClick={() => {
                        setResult(null);
                        setStep((s) => s - 1);
                    }}
                />
            )}
            <div className="flex-grow-1" />
            {step === 0 && (
                <Button label="Get Started" icon="pi pi-arrow-right" iconPos="right" onClick={() => setStep(1)} />
            )}
            {step === 1 && (
                <Button
                    label={alreadyInstalled ? 'Reinstall' : 'Install'}
                    icon="pi pi-download"
                    disabled={!serverDir || installing}
                    loading={installing}
                    onClick={handleInstall}
                />
            )}
            {step === 2 && result && !result.success && (
                <Button label="Try Again" icon="pi pi-refresh" onClick={() => setStep(1)} />
            )}
            {step === 3 && (
                <>
                    <Button
                        label="Open Config Builder"
                        icon="pi pi-cog"
                        severity="secondary"
                        outlined
                        onClick={onOpenConfigBuilder}
                    />
                    <Button label="Done" icon="pi pi-check" onClick={onHide} />
                </>
            )}
        </div>
    );

    return (
        <Dialog
            visible={!!plugin}
            onHide={onHide}
            header={plugin ? `Install: ${plugin.name}` : ''}
            style={{ width: '560px' }}
            footer={footer}
            className="install-wizard-dialog"
            closable={!installing}
        >
            <Steps model={STEPS} activeIndex={step} className="mb-4" readOnly />

            {/* Step 0: About */}
            {step === 0 && plugin && (
                <div className="install-wizard__step flex flex-column gap-3">
                    <div className="flex align-items-center gap-3 p-3 surface-100 border-round">
                        <i className="pi pi-puzzle text-4xl text-cyan-500" />
                        <div>
                            <div className="font-bold text-lg mb-1">{plugin.name} <span className="text-color-secondary font-normal text-sm">v{plugin.version}</span></div>
                            <div className="text-color-secondary text-sm">addon name: <code className="font-mono">{plugin.addonName}</code></div>
                        </div>
                    </div>
                    <p className="m-0 line-height-3">{plugin.description}</p>
                    <Message
                        severity="info"
                        text="The installer will copy the plugin files into your selected folder and show you what to add to server.cfg."
                    />
                </div>
            )}

            {/* Step 1: Select Folder */}
            {step === 1 && (
                <div className="install-wizard__step flex flex-column gap-3">
                    <p className="m-0 text-color-secondary">
                        Select the root folder of your AMS2 Dedicated Server installation.
                        This is the folder that contains <code className="font-mono">AMS2DS.exe</code> or <code className="font-mono">AMS2DS</code>.
                    </p>

                    <div className="flex gap-2">
                        <div className="flex-grow-1 p-inputtext surface-100 border-round flex align-items-center px-3 text-sm font-mono overflow-hidden">
                            <span className="white-space-nowrap overflow-hidden text-overflow-ellipsis text-color-secondary">
                                {serverDir ?? 'No folder selected'}
                            </span>
                        </div>
                        <Button label="Browse..." icon="pi pi-folder-open" outlined onClick={handleSelectFolder} />
                    </div>

                    {serverDir && (
                        <Message
                            severity={alreadyInstalled ? 'warn' : 'success'}
                            text={alreadyInstalled
                                ? 'Plugin is already installed in this folder. Installing will overwrite the existing files.'
                                : 'Plugin is not yet installed in this folder.'}
                        />
                    )}

                    {result && !result.success && (
                        <Message severity="error" text={result.error ?? 'Installation failed.'} />
                    )}
                </div>
            )}

            {/* Step 2: Install result (shown briefly on error; success jumps to step 3) */}
            {step === 2 && result && !result.success && (
                <div className="install-wizard__step flex flex-column gap-3">
                    <Message severity="error" text={result.error ?? 'Installation failed.'} />
                    <p className="m-0 text-color-secondary text-sm">
                        Please check that the folder is correct and that the application has permission to write to it.
                    </p>
                </div>
            )}

            {/* Step 3: Configure */}
            {step === 3 && (
                <div className="install-wizard__step flex flex-column gap-3">
                    <Message severity="success" text="Plugin files installed successfully." />

                    <div>
                        <p className="font-semibold mt-0 mb-2">Files installed:</p>
                        <ul className="m-0 pl-4 flex flex-column gap-1">
                            {INSTALLED_FILES.map((f) => (
                                <li key={f} className="text-sm font-mono text-color-secondary">
                                    <i className="pi pi-check text-green-500 mr-2 text-xs" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="font-semibold mt-0 mb-2">Add to your <code className="font-mono">server.cfg</code>:</p>
                        <div className="install-wizard__snippet surface-800 border-round p-3 font-mono text-sm white-space-pre line-height-3">
                            {SERVER_CFG_SNIPPET}
                        </div>
                        <div className="flex justify-content-end mt-2">
                            <Button
                                label={copied ? 'Copied!' : 'Copy to Clipboard'}
                                icon={copied ? 'pi pi-check' : 'pi pi-copy'}
                                size="small"
                                outlined
                                severity={copied ? 'success' : 'secondary'}
                                onClick={handleCopySnippet}
                            />
                        </div>
                    </div>

                    <Message
                        severity="info"
                        text="If you already have other addons, append ams2_stats to the existing addons list. You can also use the Config Builder's Lua tab to configure this visually."
                    />
                </div>
            )}
        </Dialog>
    );
}
