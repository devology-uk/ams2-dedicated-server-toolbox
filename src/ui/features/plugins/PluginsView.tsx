// src/ui/features/plugins/PluginsView.tsx

import { useState, useEffect } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import type { KnownPlugin, PluginUpdateStatus } from '../../../shared/types/api';
import type { ActiveFeature } from '../../types/ActiveFeature';
import { PluginCard } from './components/PluginCard';
import { InstallWizardDialog } from './components/InstallWizardDialog';
import './PluginsView.scss';

interface PluginsViewProps {
    onNavigateTo: (feature: ActiveFeature) => void;
}

export function PluginsView({ onNavigateTo }: PluginsViewProps) {
    const [plugins, setPlugins] = useState<KnownPlugin[]>([]);
    const [updateStatuses, setUpdateStatuses] = useState<PluginUpdateStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlugin, setSelectedPlugin] = useState<KnownPlugin | null>(null);

    useEffect(() => {
        Promise.all([
            window.electron.plugins.getKnownPlugins(),
            window.electron.plugins.getUpdateStatus(),
        ]).then(([list, statuses]) => {
            setPlugins(list);
            setUpdateStatuses(statuses);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="plugins-view h-full flex flex-column">
            <div className="plugins-view__header px-4 pt-4 pb-3 border-bottom-1 surface-border flex-shrink-0">
                <div className="flex align-items-center gap-3 mb-2">
                    <i className="pi pi-puzzle text-3xl text-cyan-500" />
                    <h1 className="m-0 text-2xl">Lua Plugins</h1>
                </div>
                <p className="m-0 text-color-secondary">
                    Install and manage Lua plugins for your AMS2 Dedicated Server.
                    Plugins extend your server with additional data capture and reporting capabilities.
                </p>
            </div>

            <div className="plugins-view__content flex-grow-1 overflow-auto p-4">
                <h2 className="mt-0 mb-3 text-lg font-semibold">Available Plugins</h2>
                <div className="plugins-view__grid">
                    {plugins.map((plugin) => (
                        <PluginCard
                            key={plugin.id}
                            plugin={plugin}
                            updateStatus={updateStatuses.find((s) => s.pluginId === plugin.id) ?? null}
                            onInstall={() => setSelectedPlugin(plugin)}
                        />
                    ))}
                </div>
            </div>

            <InstallWizardDialog
                plugin={selectedPlugin}
                onHide={() => setSelectedPlugin(null)}
                onOpenConfigBuilder={() => {
                    setSelectedPlugin(null);
                    onNavigateTo('config');
                }}
            />
        </div>
    );
}
