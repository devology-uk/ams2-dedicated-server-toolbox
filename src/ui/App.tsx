import { useState } from 'react';
import { Titlebar } from './components/Titlebar';
import { HomeView } from './features/home/HomeView';
import './App.scss';
import type { ActiveFeature } from './types/ActiveFeature';

export const App = () => {
  const [activeFeature, setActiveFeature] = useState<ActiveFeature>('home');
  return (
    <div className="app">
      <Titlebar activeFeature={activeFeature} onBack={() => setActiveFeature('home')} />
      <main className="app-content">
        <HomeView onActiveFeatureChanged={setActiveFeature} activeFeature={activeFeature} />
      </main>
    </div>
  );
};

export default App;