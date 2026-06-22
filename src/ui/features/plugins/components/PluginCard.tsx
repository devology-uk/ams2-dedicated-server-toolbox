// src/ui/features/plugins/components/PluginCard.tsx

import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import type { KnownPlugin, PluginUpdateStatus } from '../../../../shared/types/api';

interface PluginCardProps {
    plugin: KnownPlugin;
    updateStatus: PluginUpdateStatus | null;
    onInstall: () => void;
}

export function PluginCard({ plugin, updateStatus, onInstall }: PluginCardProps) {
    return (
        <Card className="plugin-card h-full">
            <div className="flex flex-column gap-3 h-full">
                <div className="flex align-items-start justify-content-between gap-2">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-puzzle text-xl text-cyan-500" />
                        <span className="font-semibold text-lg">{plugin.name}</span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Tag value={`v${plugin.version}`} severity="info" />
                        {plugin.bundled && <Tag value="Bundled" severity="success" />}
                    </div>
                </div>

                <p className="m-0 text-color-secondary line-height-3 flex-grow-1">
                    {plugin.description}
                </p>

                {updateStatus?.updateAvailable && (
                    <Message
                        severity="warn"
                        text={
                            updateStatus.lastSeenVersion === '0.0'
                                ? `A newer version (v${updateStatus.latestVersion}) is available with Steam ID and AI driver tracking. Click Update to install it.`
                                : `Your server is running v${updateStatus.lastSeenVersion}. Click Update to get v${updateStatus.latestVersion}.`
                        }
                    />
                )}

                <div className="flex align-items-center justify-content-between pt-2 border-top-1 surface-border">
                    <span className="text-xs text-color-secondary font-mono">
                        addon: <strong>{plugin.addonName}</strong>
                    </span>
                    <Button
                        label={updateStatus?.updateAvailable ? 'Update' : 'Install'}
                        icon={updateStatus?.updateAvailable ? 'pi pi-sync' : 'pi pi-download'}
                        size="small"
                        severity={updateStatus?.updateAvailable ? 'warning' : undefined}
                        onClick={onInstall}
                    />
                </div>
            </div>
        </Card>
    );
}
