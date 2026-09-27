// src/components/About/AboutData.tsx
// Replaces the three always-open Panel boxes ("How to read this" / "What
// this doesn't show" / "Where this came from") with one collapsed
// disclosure. All three still say something worth reading, but none of
// them are needed to use the dashboard -- so they shouldn't cost three
// card's worth of space on every screen. Progressive disclosure: closed
// by default, one click away.
import './AboutData.css';

export function AboutData() {
  return (
    <details className="about-data">
      <summary className="about-data__summary">
        About this data
      </summary>
      <div className="about-data__body">
        <div className="about-data__section">
          <h3>How to read this</h3>
          <p>
            The scorecards give national (or filtered) figures for both networks side by side —
            the bolder number on each card is the one ahead. The map shades each state by
            whichever network has the better composite quality score there; a deeper color means
            a wider gap, not just a higher score. States with a diagonal hatch have too few
            reports to trust the comparison. Click any state to filter the whole dashboard to it.
          </p>
        </div>
        <div className="about-data__section">
          <h3>What this doesn't show</h3>
          <p>
            Airtel and Jio have very different amounts of feedback in this data — treat any
            location or time range flagged with limited feedback as directional, not conclusive.
            Self-reported feedback likely over-represents engaged, dissatisfied users. Coverage on
            the performance profile measures how many states a network has any reports in, not
            signal strength within a state. There's no data on price, plan, or device, and rural
            areas with poor connectivity may be underrepresented in reporting.
          </p>
        </div>
        <div className="about-data__section">
          <h3>Where this came from</h3>
          <p>
            Source: Airtel and Jio call-quality feedback exports (columns: inout, operator,
            network_type, rating, calldrop_category, latitude, longitude, state_name, month,
            year). State boundaries: DataMeet's India administrative boundaries, simplified for
            web rendering. Rows with an invalid rating, year, or region are rejected during
            ingestion rather than silently dropped or corrected.
          </p>
        </div>
      </div>
    </details>
  );
}
