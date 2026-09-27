import { useMemo, useState } from 'react';
import { TopBar } from './components/TopBar/TopBar';
import { HeroStrip } from './components/HeroStrip/HeroStrip';
import { FilterBar } from './components/FilterBar/FilterBar';
import { IndiaMap } from './components/Map/IndiaMap';
import { MetricPanel } from './components/MetricPanel/MetricPanel';
import { PerformanceProfile } from './components/PerformanceProfile/PerformanceProfile';
import { RadarProfile } from './components/RadarProfile/RadarProfile';
import { AboutView } from './components/AboutView/AboutView';
import { useDashboardState } from './hooks/useDashboardState';
import { useTheme } from './hooks/useTheme';
import { buildStateGaps } from './lib/analysis';
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

  const stateGaps = useMemo(() => buildStateGaps(data.stateQuality?.states ?? []), [data.stateQuality]);
  const visibleStateGaps = useMemo(() => stateGaps.slice(0, 7), [stateGaps]);

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
          <HeroStrip kpis={data.kpis} selectedState={selectedState} loading={loading} />
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
            <section className="at-a-glance" aria-label="National snapshot">
              <div className="section-heading">
                <div>
                  <div className="section-kicker">At a glance</div>
                  <h2>Three signals worth seeing together.</h2>
                </div>
                <p>Exact values for the current filters. The map below moves from <strong>what</strong> differs to <strong>where</strong> it differs.</p>
              </div>
              <MetricPanel kpis={data.kpis} carrierVisibility={carrierVisibility} />
            </section>

            <section className="geography-section" aria-label="Geographic comparison">
              <div className="section-heading section-heading--tight">
                <div>
                  <div className="section-kicker">Where it changes</div>
                  <h2>Which states show the clearest difference?</h2>
                </div>
                <p>Click a state on the map or in the ranking to focus every section.</p>
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

                <aside className="insight-rail" aria-label="State and performance insights">
                  <section className="gap-panel">
                    <div className="gap-panel__header">
                      <div>
                        <div className="section-kicker">Top 7</div>
                        <h3>Largest rating gaps</h3>
                        <p>States ordered by the absolute difference in reported average rating.</p>
                      </div>
                      <span>{stateGaps.length} comparable</span>
                    </div>

                    <div className="gap-list">
                      {visibleStateGaps.map((row, index) => (
                        <button
                          key={row.stateName}
                          className={`gap-row ${selectedState === row.stateName ? 'is-selected' : ''}`}
                          onClick={() => setSelectedState(selectedState === row.stateName ? undefined : row.stateName)}
                        >
                          <span className="gap-row__rank">{String(index + 1).padStart(2, '0')}</span>
                          <span className="gap-row__state"><strong>{row.stateName}</strong><small>{row.region ?? 'Region unavailable'} · {row.reports.toLocaleString('en-IN')} reports</small></span>
                          <span className="gap-row__values"><b className="airtel">{row.airtel?.toFixed(2) ?? '—'}</b><span>vs</span><b className="jio">{row.jio?.toFixed(2) ?? '—'}</b></span>
                          <span className={`gap-row__badge ${row.leader === 'Airtel' ? 'airtel-bg' : row.leader === 'Jio' ? 'jio-bg' : ''}`}>{row.leader === 'Airtel' ? `Airtel +${row.gap?.toFixed(2)}` : row.leader === 'Jio' ? `Jio +${row.gap?.toFixed(2)}` : 'Similar'}</span>
                        </button>
                      ))}
                      {!visibleStateGaps.length && <div className="gap-empty">No comparable state ratings for the current filters.</div>}
                    </div>
                  </section>

                  <RadarProfile
                    radarAirtel={data.radarAirtel}
                    radarJio={data.radarJio}
                    carrierVisibility={carrierVisibility}
                    theme={theme}
                  />
                </aside>
              </div>
            </section>

            <PerformanceProfile
              indoorOutdoor={data.indoorOutdoor}
              carrierVisibility={carrierVisibility}
            />
          </main>
        </>
      )}
    </div>
  );
}
