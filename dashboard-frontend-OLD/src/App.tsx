// src/App.tsx
import { Header } from './components/Header/Header';
import { FilterSidebar } from './components/Sidebar/FilterSidebar';
import { KpiStrip } from './components/Kpi/KpiStrip';
import { IndiaMap } from './components/Map/IndiaMap';
import { RadarProfile } from './components/Radar/RadarProfile';
import { IndoorOutdoorBars } from './components/Bars/IndoorOutdoorBars';
import { Panel } from './components/Panel/Panel';
import { useDashboardState } from './hooks/useDashboardState';
import { OPERATOR_COLOR } from './lib/constants';
import './App.css';

export default function App() {
  const {
    region,
    setRegion,
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

  return (
    <div className="app">
      <Header loading={loading} error={error} />

      <div className="app__body">
        <FilterSidebar
          region={region}
          onRegionChange={setRegion}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          yearRange={yearRange}
          onYearRangeChange={setYearRange}
          carrierVisibility={carrierVisibility}
          onCarrierVisibilityChange={setCarrierVisibility}
          filterOptions={data.filterOptions}
        />

        <main className="app__main">
          <KpiStrip kpis={data.kpis} carrierVisibility={carrierVisibility} />

          <div className="app__grid">
            <section className="app__map-column">
              <div className="app__section-heading">
                <h2>Regional quality heatmap</h2>
                <div className="app__map-legend">
                  <span>
                    <i style={{ background: OPERATOR_COLOR.Airtel }} /> Airtel leads
                  </span>
                  <span>
                    <i style={{ background: OPERATOR_COLOR.Jio }} /> Jio leads
                  </span>
                  <span>
                    <i className="app__map-legend-hatch" /> Low sample
                  </span>
                </div>
              </div>
              <IndiaMap
                stateRows={data.stateQuality?.states ?? []}
                confidenceRows={data.confidence?.confidence ?? []}
                carrierVisibility={carrierVisibility}
                selectedState={selectedState}
                onSelectState={setSelectedState}
              />
              {selectedState && (
                <p className="app__map-selection">
                  Filtered to <strong>{selectedState}</strong> —{' '}
                  <button className="app__link-button" onClick={() => setSelectedState(undefined)}>
                    clear
                  </button>
                </p>
              )}
            </section>

            <section className="app__side-column">
              <div className="app__section-heading">
                <h2>Airtel vs Jio performance profile</h2>
              </div>
              <RadarProfile
                radarAirtel={data.radarAirtel}
                radarJio={data.radarJio}
                carrierVisibility={carrierVisibility}
              />

              <div className="app__section-heading app__section-heading--tight">
                <h2>Indoor vs outdoor</h2>
              </div>
              <IndoorOutdoorBars data={data.indoorOutdoor} carrierVisibility={carrierVisibility} />
            </section>
          </div>

          <div className="app__panels">
            <Panel title="How to read this">
              <p>
                This dashboard compares customer-reported voice quality for Airtel and Jio across
                India, 2021–2025. The KPI strip gives national (or filtered) baselines for report
                volume, call-drop rate, average rating, and poor-voice-quality rate.
              </p>
              <p>
                The map shades each state by whichever operator has the better composite quality
                score there — deeper color means a wider gap between the two, not just a higher
                score. States with a diagonal hatch have too few reports to trust the comparison;
                click any state to filter the whole dashboard to it.
              </p>
              <p>
                The radar compares both operators across six dimensions at once; the bar chart
                below it breaks quality down by indoor vs outdoor reporting conditions, since
                building penetration is a very different problem from open-air coverage.
              </p>
            </Panel>

            <Panel title="What this doesn't show" recessed>
              <p>
                Airtel and Jio have very different sample sizes in this dataset — treat any
                state or filter combination with a low <code>n</code> (shown next to every KPI,
                and hatched on the map) as directional, not conclusive.
              </p>
              <ul>
                <li>Self-reported feedback likely over-represents engaged, dissatisfied users.</li>
                <li>
                  Coverage on the radar measures how many states an operator has any reports in —
                  it says nothing about signal strength within a state.
                </li>
                <li>No data on price, plan type, or device — quality alone doesn't explain churn.</li>
                <li>Rural areas with poor connectivity may also be underrepresented in reporting.</li>
              </ul>
            </Panel>

            <Panel title="Where this came from">
              <p>
                Source: Airtel and Jio call-quality feedback exports (columns: inout, operator,
                network_type, rating, calldrop_category, latitude, longitude, state_name, month,
                year). State boundaries: DataMeet's India administrative boundaries (state-level
                GeoJSON), simplified for web rendering.
              </p>
              <p>
                Rows with an invalid rating, year, or region are rejected during ingestion (see
                <code> rejected_rows.csv</code>) rather than silently dropped or corrected.
              </p>
            </Panel>
          </div>
        </main>
      </div>
    </div>
  );
}
