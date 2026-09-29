import { useState } from 'react';
import { TopBar } from './components/TopBar/TopBar';
import { HeroStrip } from './components/HeroStrip/HeroStrip';
import { FilterBar } from './components/FilterBar/FilterBar';
import { IndiaMap } from './components/Map/IndiaMap';
import { RadarProfile } from './components/RadarProfile/RadarProfile';
import { PerformanceProfile } from './components/PerformanceProfile/PerformanceProfile';
import { AboutView } from './components/AboutView/AboutView';
import { useDashboardState } from './hooks/useDashboardState';
import { useTheme } from './hooks/useTheme';
import './App.css';

type DashboardView = 'overview' | 'about';

export default function App() {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const {
    selectedState,
    setSelectedState,
    yearRange,
    setYearRange,
    carrierVisibility,
    setCarrierVisibility,
    data,
    loading,
    error,
  } = useDashboardState();
  const { theme, toggleTheme } = useTheme();

  const handleViewChange = (view: DashboardView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app" data-theme={theme}>
      <TopBar
        loading={loading}
        error={error}
        theme={theme}
        onToggleTheme={toggleTheme}
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      {activeView === 'about' ? (
        <AboutView />
      ) : (
        <>
          <HeroStrip
            kpis={data.kpis}
            selectedState={selectedState}
            loading={loading}
            carrierVisibility={carrierVisibility}
            onCarrierVisibilityChange={setCarrierVisibility}
          />

          <main className="app__main">
            <section className="geography-section" aria-label="Geographic view">
              <div className="geography-workbench">
                <div className="geography-grid">
                  <IndiaMap
                    stateRows={data.stateQuality?.states ?? []}
                    confidenceRows={data.confidence?.confidence ?? []}
                    carrierVisibility={carrierVisibility}
                    selectedState={selectedState}
                    onSelectState={setSelectedState}
                    theme={theme}
                  >
                    <FilterBar
                      embedded
                      selectedState={selectedState}
                      onStateChange={setSelectedState}
                      yearRange={yearRange}
                      onYearRangeChange={setYearRange}
                      carrierVisibility={carrierVisibility}
                      onCarrierVisibilityChange={setCarrierVisibility}
                      filterOptions={data.filterOptions}
                    />
                  </IndiaMap>

                  <aside className="insight-rail" aria-label="Supporting performance views">
                    <RadarProfile
                      radarAirtel={data.radarAirtel}
                      radarJio={data.radarJio}
                      carrierVisibility={carrierVisibility}
                      theme={theme}
                    />
                    <PerformanceProfile
                      indoorOutdoor={data.indoorOutdoor}
                      carrierVisibility={carrierVisibility}
                    />
                  </aside>
                </div>
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}
