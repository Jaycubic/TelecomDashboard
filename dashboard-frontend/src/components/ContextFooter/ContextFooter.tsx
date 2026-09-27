// src/components/ContextFooter/ContextFooter.tsx
import './ContextFooter.css';

export function ContextFooter() {
  return (
    <footer className="ctx-footer">
      <div className="ctx-footer__grid">
        <div className="ctx-footer__cell">
          <p className="ctx-footer__heading">How to read this</p>
          <p className="ctx-footer__body">
            The map and metrics show which network customers in each location reported
            better voice call quality with. Deeper color on the map means a wider gap
            between the two operators, not a higher absolute score. States with a hatch
            pattern have fewer than 30 reports — treat those as directional signals only.
          </p>
        </div>

        <div className="ctx-footer__cell">
          <p className="ctx-footer__heading">What this data doesn't cover</p>
          <p className="ctx-footer__body">
            Self-reported feedback likely over-represents engaged or dissatisfied users.
            Rural areas with poor connectivity may also be underrepresented. No data on
            price, plan type, or device type — call quality alone doesn't explain customer
            choices. Coverage on the radar reflects how many states have any reports, not
            signal strength within a state.
          </p>
        </div>

        <div className="ctx-footer__cell">
          <p className="ctx-footer__heading">Data source</p>
          <p className="ctx-footer__body">
            Customer-reported voice call quality feedback from Airtel and Jio, 2021–2025.
            Fields: call context (indoor/outdoor/travelling), network type, rating, call-drop
            category, location, and date. State boundaries from DataMeet's India administrative
            boundaries (GeoJSON). Rows with invalid rating, year, or region are excluded during
            ingestion rather than corrected.
          </p>
        </div>
      </div>
    </footer>
  );
}
