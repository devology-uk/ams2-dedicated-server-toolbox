// src/ui/features/home/Toolbox.tsx

import { FeatureTile } from './components/FeatureTile';
import type { ActiveFeature } from '../../types/ActiveFeature';

import './Toolbox.scss';

interface ToolboxProps {
    onFeatureSelect: (feature: ActiveFeature) => void;
}

export const Toolbox = ({ onFeatureSelect }: ToolboxProps) => {
    return (
        <div className="toolbox">
            <header className="toolbox__header">
                <i className="pi pi-car toolbox__logo" />
                <h1 className="toolbox__title">AMS2 Dedicated Server Toolbox</h1>
                <p className="toolbox__subtitle">
                    Tools for managing your Automobilista 2 dedicated servers
                </p>
            </header>

            <div className="toolbox__grid">
                <FeatureTile
                    title="API Explorer"
                    description="Connect to a running server and explore the HTTP API endpoints"
                    icon="pi pi-code"
                    color="blue"
                    onClick={() => onFeatureSelect('api')}
                />
                <FeatureTile
                    title="Config Builder"
                    description="Create and edit server configuration files with a guided form"
                    icon="pi pi-cog"
                    color="orange"
                    onClick={() => onFeatureSelect('config')}
                />
                <FeatureTile
                    title="Stats Viewer"
                    description="Load a stats file and explore server and player statistics"
                    icon="pi pi-chart-bar"
                    color="green"
                    onClick={() => onFeatureSelect('stats')}
                />
                <FeatureTile
                    title="Results Viewer"
                    description="Import stats data and browse race results, lap times and driver performance"
                    icon="pi pi-trophy"
                    color="purple"
                    onClick={() => onFeatureSelect('results')}
                />
            </div>
        </div>
    );
};