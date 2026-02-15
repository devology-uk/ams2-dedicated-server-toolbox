// src/ui/App.tsx

import { useState } from 'react';
import { Titlebar } from './components/Titlebar';
import { Toolbox } from './features/home/Toolbox';
import { ApiExplorerView } from './features/api-explorer/ApiExplorerView';
import { ConfigBuilderView } from './features/config-builder/ConfigBuilderView';
import { StatsViewer } from './features/stats/StatsViewer';
import { ResultsViewer } from './features/results/ResultsViewer';
import type { ActiveFeature } from './types/ActiveFeature';

import './App.scss';

export const App = () => {
    const [activeFeature, setActiveFeature] = useState<ActiveFeature>('home');

    const handleBack = () => setActiveFeature('home');

    const renderFeature = () => {
        switch (activeFeature) {
            case 'api':
                return <ApiExplorerView />;
            case 'config':
                return <ConfigBuilderView />;
            case 'stats':
                return <StatsViewer />;
            case 'results':
                return <ResultsViewer />;
            default:
                return <Toolbox onFeatureSelect={setActiveFeature} />;
        }
    };

    return (
        <div className="app">
            <Titlebar activeFeature={activeFeature} onBack={handleBack} />
            <main className="app-content">{renderFeature()}</main>
        </div>
    );
};

export default App;