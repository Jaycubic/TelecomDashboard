// src/App.tsx
import { UtilityBar } from './components/UtilityBar/UtilityBar';
import { FilterBar } from './components/FilterBar/FilterBar';
import { ScoreCards } from './components/Overview/ScoreCards';
import { IndiaMap } from './components/Map/IndiaMap';
import { RadarProfile } from './components/Radar/RadarProfile';
import { IndoorOutdoorBars } from './components/Bars/IndoorOutdoorBars';
import { AboutData } from './components/About/AboutData';
import { useDashboardState } from './hooks/useDashboardState';
import { useTheme } from './hooks/useTheme';
import { OPERATOR_COLOR } from './lib/constants';
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
    <div className="app">
      <UtilityBar loading={loading} error={error} theme={theme} onToggleTheme={toggleTheme} />

      <main className="app__main">
        <section className="hero">
          <h1 className="hero__title">Airtel vs Jio</h1>
          <p className="hero__subtitle">Customer-reported call quality across India, 2021–2025</p>

          <ScoreCards kpis={data.kpis} carrierVisibility={carrierVisibility} />

          <FilterBar
            selectedState={selectedState}
            onStateChange={setSelectedState}
            yearRange={yearRange}
            onYearRangeChange={setYearRange}
            carrierVisibility={carrierVisibility}
            onCarrierVisibilityChange={setCarrierVisibility}
            filterOptions={data.filterOptions}
          />
        </section>

        <section className="map-feature">
          <div className="map-feature__heading">
            <h2>Where quality differs</h2>
            <p>Each state shows which network reports better call quality.</p>
          </div>

          <div className="map-feature__legend">
            <span>
              <i style={{ background: OPERATOR_COLOR.Airtel }} /> Airtel better
            </span>
            <span>
              <i style={{ background: OPERATOR_COLOR.Jio }} /> Jio better
            </span>
            <span>
              <i style={{ background: '#9AA0A6' }} /> Similar
            </span>
            <span title="Fewer reports are available for this state, so the comparison may be less representative.">
              <i className="map-feature__legend-hatch" /> Limited feedback
            </span>
          </div>

          <IndiaMap
            stateRows={data.stateQuality?.states ?? []}
            confidenceRows={data.confidence?.confidence ?? []}
            carrierVisibility={carrierVisibility}
            selectedState={selectedState}
            onSelectState={setSelectedState}
            theme={theme}
          />

          {selectedState && (
            <p className="map-feature__selection">
              Filtered to <strong>{selectedState}</strong> —{' '}
              <button className="app__link-button" onClick={() => setSelectedState(undefined)}>
                clear
              </button>
            </p>
          )}
        </section>

        <section className="secondary-grid">
          <div className="card">
            <h2 className="card__title">Performance profile</h2>
            <RadarProfile
              radarAirtel={data.radarAirtel}
              radarJio={data.radarJio}
              carrierVisibility={carrierVisibility}
              theme={theme}
            />
          </div>

          <div className="card">
            <h2 className="card__title">Indoor vs outdoor</h2>
            <IndoorOutdoorBars data={data.indoorOutdoor} carrierVisibility={carrierVisibility} theme={theme} />
          </div>
        </section>

        <AboutData />
      </main>
    </div>
  );
}
