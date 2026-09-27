// src/App.tsx — Signal Strength Dashboard (redesigned)
import { TopBar } from './components/TopBar/TopBar';
import { HeroStrip } from './components/HeroStrip/HeroStrip';
import { FilterBar } from './components/FilterBar/FilterBar';
import { IndiaMap } from './components/Map/IndiaMap';
import { MetricPanel } from './components/MetricPanel/MetricPanel';
import { PerformanceProfile } from './components/PerformanceProfile/PerformanceProfile';
import { ContextFooter } from './components/ContextFooter/ContextFooter';
import { useDashboardState } from './hooks/useDashboardState';
import { useTheme } from './hooks/useTheme';
import './App.css';

export default function App() {
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

  return (
    <div className="app" data-theme={theme}>
      <TopBar
        loading={loading}
        error={error}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <HeroStrip
        kpis={data.kpis}
        selectedState={selectedState}
        loading={loading}
      />

      <FilterBar
        selectedState={selectedState}
        onStateChange={setSelectedState}
        yearRange={yearRange}
        onYearRangeChange={setYearRange}
        carrierVisibility={carrierVisibility}
        onCarrierVisibilityChange={setCarrierVisibility}
        filterOptions={data.filterOptions}
      />

      <main className="app__main">
        {/* Map (primary) + Metrics (secondary) — side by side */}
        <div className="app__body">
          <section className="app__map-col" aria-label="Geographic comparison">
            <IndiaMap
              stateRows={data.stateQuality?.states ?? []}
              confidenceRows={data.confidence?.confidence ?? []}
              carrierVisibility={carrierVisibility}
              selectedState={selectedState}
              onSelectState={setSelectedState}
              theme={theme}
            />
          </section>

          <aside className="app__metrics-col">
            <MetricPanel
              kpis={data.kpis}
              indoorOutdoor={data.indoorOutdoor}
              carrierVisibility={carrierVisibility}
            />
          </aside>
        </div>

        {/* Full-width performance profile (radar + indoor) */}
        <PerformanceProfile
          radarAirtel={data.radarAirtel}
          radarJio={data.radarJio}
          indoorOutdoor={data.indoorOutdoor}
          carrierVisibility={carrierVisibility}
          theme={theme}
        />

        <ContextFooter />
      </main>
    </div>
  );
}
