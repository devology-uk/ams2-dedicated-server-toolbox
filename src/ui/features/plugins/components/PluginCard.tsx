// src/ui/features/plugins/components/PluginCard.tsx

import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import type { KnownPlugin } from '../../../../shared/types/api';

interface PluginCardProps {
    plugin: KnownPlugin;
    onInstall: () => void;
}

export function PluginCard({ plugin, onInstall }: PluginCardProps) {
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

                <div className="flex align-items-center justify-content-between pt-2 border-top-1 surface-border">
                    <span className="text-xs text-color-secondary font-mono">
                        addon: <strong>{plugin.addonName}</strong>
                    </span>
                    <Button
                        label="Install"
                        icon="pi pi-download"
                        size="small"
                        onClick={onInstall}
                    />
                </div>
            </div>
        </Card>
    );
}
