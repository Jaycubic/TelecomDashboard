import { useState } from 'react';
import { TopBar } from './components/TopBar/TopBar';
import { HeroStrip } from './components/HeroStrip/HeroStrip';
import { FilterBar } from './components/FilterBar/FilterBar';
import { IndiaMap } from './components/Map/IndiaMap';
import { MetricPanel } from './components/MetricPanel/MetricPanel';
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

  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;
  const selectedOperator = carrierVisibility.Airtel ? 'Airtel' : 'Jio';

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
            <section className="at-a-glance" aria-label="National voice-call quality snapshot">
              <div className="section-heading">
                <div>
                  <div className="section-kicker">At a glance</div>
                  <h2>{bothVisible ? 'Three measures of voice-call experience.' : `Voice-call experience on ${selectedOperator}.`}</h2>
                </div>
                <p>
                  {bothVisible
                    ? 'These measures describe what customers reported. Compare the values first; use the map below to see where the pattern changes.'
                    : `These measures describe what ${selectedOperator} customers reported in the current filters. Use the map below to see how ratings vary by state.`}
                </p>
              </div>
              <MetricPanel kpis={data.kpis} carrierVisibility={carrierVisibility} />
            </section>

            <section className="geography-section" aria-label="Geographic view">
              <div className="section-heading section-heading--tight">
                <div>
                  <div className="section-kicker">Geography</div>
                  <h2>{bothVisible ? 'Where do customer ratings differ?' : `Where is the reported rating higher or lower for ${selectedOperator}?`}</h2>
                </div>
                <p>
                  {bothVisible
                    ? 'The map answers the comparison question state by state. Select a state to bring its values into focus.'
                    : `The map switches from comparison to a rating range for ${selectedOperator}. Darker states represent higher reported average ratings.`}
                </p>
              </div>

              <div className="geography-grid">
                <IndiaMap
                  stateRows={data.stateQuality?.states ?? []}
                  confidenceRows={data.confidence?.confidence ?? []}
                  carrierVisibility={carrierVisibility}
                  selectedState={selectedState}
                  onSelectState={setSelectedState}
                  theme={theme}
                />

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
            </section>

          </main>
        </>
      )}
    </div>
  );
}
