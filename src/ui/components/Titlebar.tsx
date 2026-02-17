// src/ui/components/Titlebar.tsx

import { Button } from 'primereact/button';

import './Titlebar.scss';
import type { ActiveFeature } from '../types/ActiveFeature.js';

interface TitlebarProps {
    title?: string;
    activeFeature: ActiveFeature;
    onBack?: () => void;
    updateReady?: boolean;
    onInstallUpdate?: () => void;
}

const FEATURE_LABELS: Record<ActiveFeature, string | null> = {
    home: null,
    api: 'API Explorer',
    config: 'Config Builder',
    stats: 'Stats Viewer',
    results: 'Results Viewer',
};

export const Titlebar = ({
                             title = 'AMS2 Dedicated Server Toolbox',
                             activeFeature,
                             onBack,
                             updateReady,
                             onInstallUpdate,
                         }: TitlebarProps) => {
    const featureLabel = FEATURE_LABELS[activeFeature];
    const showBack = activeFeature !== 'home';

    return (
        <div className="titlebar">
            <div className="titlebar-drag-region">
                {showBack && (
                    <Button
                        icon="pi pi-arrow-left"
                        className="p-button-text p-button-plain titlebar-back-button"
                        onClick={onBack}
                        tooltip="Back to Toolbox"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                )}
                <div className="titlebar-title">
                    <i className="pi pi-car" style={{ marginRight: '8px' }} />
                    <span>{title}</span>
                    {featureLabel && (
                        <span className="titlebar-feature-label">
              <i className="pi pi-chevron-right" style={{ fontSize: '0.7rem', margin: '0 0.5rem' }} />
                            {featureLabel}
            </span>
                    )}
                </div>
            </div>
            {updateReady && (
                <Button
                    label="Update"
                    icon="pi pi-download"
                    className="p-button-text p-button-sm titlebar-update-button"
                    onClick={onInstallUpdate}
                    tooltip="Update available — click to restart and install"
                    tooltipOptions={{ position: 'bottom' }}
                />
            )}
        </div>
    );
};