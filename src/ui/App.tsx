// src/ui/App.tsx

import { useState, useEffect } from 'react';
import { Titlebar } from './components/Titlebar';
import { Toolbox } from './features/home/Toolbox';
import { ApiExplorerView } from './features/api-explorer/ApiExplorerView';
import { ConfigBuilderView } from './features/config-builder/ConfigBuilderView';
import { StatsViewer } from './features/stats/StatsViewer';
import { ResultsViewer } from './features/results/ResultsViewer';
import { WhatsNewDialog } from './components/WhatsNewDialog';
import type { WhatsNewContent } from '../shared/types/api';
import type { ActiveFeature } from './types/ActiveFeature';

import './App.scss';

export const App = () => {
    const [activeFeature, setActiveFeature] = useState<ActiveFeature>('home');
    const [updateReady, setUpdateReady] = useState(false);
    const [whatsNew, setWhatsNew] = useState<WhatsNewContent | null>(null);

    useEffect(() => {
        return window.electron.onUpdateReady(() => setUpdateReady(true));
    }, []);

    useEffect(() => {
        window.electron.whatsNew.get().then((content) => {
            if (content) setWhatsNew(content);
        });
    }, []);

    const handleWhatsNewDismiss = () => {
        window.electron.whatsNew.dismiss();
        setWhatsNew(null);
    };

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
            <Titlebar
                activeFeature={activeFeature}
                onBack={handleBack}
                updateReady={updateReady}
                onInstallUpdate={() => window.electron.installUpdate()}
            />
            <main className="app-content">{renderFeature()}</main>
            {whatsNew && (
                <WhatsNewDialog
                    visible
                    currentVersion={whatsNew.currentVersion}
                    markdown={whatsNew.markdown}
                    onDismiss={handleWhatsNewDismiss}
                />
            )}
        </div>
    );
};

export default App;