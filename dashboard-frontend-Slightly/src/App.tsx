import { useState } from 'react';
import { HeroStrip } from './components/HeroStrip/HeroStrip';
import { FilterBar } from './components/FilterBar/FilterBar';
import { IndiaMap } from './components/Map/IndiaMap';
import { PerformanceProfile } from './components/PerformanceProfile/PerformanceProfile';
import { TrendChart } from './components/TrendChart/TrendChart';
import { AboutView } from './components/AboutView/AboutView';
import { useDashboardState } from './hooks/useDashboardState';
import { useTheme } from './hooks/useTheme';
import './App.css';

type DashboardView = 'overview' | 'about';

export default function App() {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const { selectedState, setSelectedState, yearRange, setYearRange, carrierVisibility, setCarrierVisibility, data, loading, spatialLoading, error } = useDashboardState();
  const { theme, toggleTheme } = useTheme();
  const openAbout = () => { setActiveView('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goBack = () => { setActiveView('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="app" data-theme={theme}>
      {activeView === 'about' ? <AboutView onBack={goBack} /> : (
        <>
          <HeroStrip
            kpis={data.kpis}
            filterOptions={data.filterOptions}
            selectedState={selectedState}
            yearRange={yearRange}
            loading={loading}
            error={error}
            carrierVisibility={carrierVisibility}
            onCarrierVisibilityChange={setCarrierVisibility}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenAbout={openAbout}
          />
          <main className="app__main">
            <section className="geography-section" aria-label="India map exploration">
              <div className="geography-grid">
                <div className="map-column">
                  <FilterBar
                    selectedState={selectedState}
                    onStateChange={setSelectedState}
                    yearRange={yearRange}
                    onYearRangeChange={setYearRange}
                    filterOptions={data.filterOptions}
                  />
                  <IndiaMap
                    stateRows={data.stateQuality?.states ?? []}
                    confidenceRows={data.confidence?.confidence ?? []}
                    spatialCells={data.spatialCells?.cells ?? []}
                    spatialLoading={spatialLoading}
                    carrierVisibility={carrierVisibility}
                    selectedState={selectedState}
                    onSelectState={setSelectedState}
                    topology={data.mapTopology}
                    theme={theme}
                  />
                </div>
                <aside className="insight-rail" aria-label="Supporting trend and call-setting views">
                  <TrendChart trend={data.trend} carrierVisibility={carrierVisibility} yearRange={yearRange} theme={theme} />
                  <PerformanceProfile indoorOutdoor={data.indoorOutdoor} carrierVisibility={carrierVisibility} />
                </aside>
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}
