import { useMemo } from 'react';
import { TopBar } from './components/TopBar/TopBar';
import { HeroStrip } from './components/HeroStrip/HeroStrip';
import { FilterBar } from './components/FilterBar/FilterBar';
import { IndiaMap } from './components/Map/IndiaMap';
import { MetricPanel } from './components/MetricPanel/MetricPanel';
import { PerformanceProfile } from './components/PerformanceProfile/PerformanceProfile';
import { ContextFooter } from './components/ContextFooter/ContextFooter';
import { useDashboardState } from './hooks/useDashboardState';
import { useTheme } from './hooks/useTheme';
import { buildStateGaps } from './lib/analysis';
import { toNumber } from './lib/format';
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

  const stateGaps = useMemo(() => buildStateGaps(data.stateQuality?.states ?? []), [data.stateQuality]);
  const visibleStateGaps = useMemo(() => stateGaps.slice(0, 7), [stateGaps]);

  return (
    <div className="app" data-theme={theme}>
      <TopBar loading={loading} error={error} theme={theme} onToggleTheme={toggleTheme} />
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
        <div className="app__overview">
          <MetricPanel kpis={data.kpis} carrierVisibility={carrierVisibility} />
          <section className="gap-panel">
            <div className="gap-panel__header">
              <div>
                <div className="section-kicker">State comparison</div>
                <h2>Where are the largest rating gaps?</h2>
                <p>States are ordered by the absolute difference in average customer rating. This is a comparison aid, not a quality score.</p>
              </div>
              <span className="gap-panel__scope">{stateGaps.length} states with comparable ratings</span>
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
                  <span className="gap-row__values">
                    <b className="airtel">{row.airtel?.toFixed(2) ?? '—'}</b>
                    <span>vs</span>
                    <b className="jio">{row.jio?.toFixed(2) ?? '—'}</b>
                  </span>
                  <span className={`gap-row__badge ${row.leader === 'Airtel' ? 'airtel-bg' : row.leader === 'Jio' ? 'jio-bg' : ''}`}>
                    {row.leader === 'Airtel' ? `Airtel +${row.gap?.toFixed(2)}` : row.leader === 'Jio' ? `Jio +${row.gap?.toFixed(2)}` : 'Similar'}
                  </span>
                </button>
              ))}
              {!visibleStateGaps.length && <div className="gap-empty">No comparable state ratings for the current filters.</div>}
            </div>
          </section>
        </div>

        <IndiaMap
          stateRows={data.stateQuality?.states ?? []}
          confidenceRows={data.confidence?.confidence ?? []}
          carrierVisibility={carrierVisibility}
          selectedState={selectedState}
          onSelectState={setSelectedState}
          theme={theme}
        />

        <PerformanceProfile
          indoorOutdoor={data.indoorOutdoor}
          carrierVisibility={carrierVisibility}
          theme={theme}
        />

        {selectedState && data.kpis && (
          <section className="focus-strip">
            <div>
              <div className="section-kicker">Focused view</div>
              <h2>{selectedState}</h2>
              <p>The filters above now apply to every section of the dashboard. Use “All India” in State to return to the national view.</p>
            </div>
            <div className="focus-strip__facts">
              {data.kpis.kpis.map((row) => (
                <div key={row.operator}>
                  <span className={row.operator === 'Airtel' ? 'airtel' : 'jio'}>{row.operator}</span>
                  <strong>{toNumber(row.avg_rating)?.toFixed(2) ?? '—'}</strong>
                  <small>avg rating</small>
                </div>
              ))}
            </div>
          </section>
        )}

        <ContextFooter />
      </main>
    </div>
  );
}
