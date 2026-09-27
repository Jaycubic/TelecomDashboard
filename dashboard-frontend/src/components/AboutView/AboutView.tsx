import './AboutView.css';

export function AboutView() {
  return (
    <main className="about-view">
      <section className="about-view__hero">
        <div className="section-kicker">About this dashboard</div>
        <h1>Explore customer-reported voice-call experience — compare Airtel and Jio, or focus on one network.</h1>
        <p>
          The dashboard starts with a national picture, moves to the state map for geographic exploration, and then reveals more detail when a user needs it. The network view controls whether the experience is comparative or operator-specific.
        </p>
      </section>

      <section className="about-view__grid">
        <article>
          <div className="section-kicker">How to read this</div>
          <h2>Follow the information hierarchy.</h2>
          <p><strong>1. National picture.</strong> Read the customer-report volume and the three main voice-call measures for the current filters.</p>
          <p><strong>2. Geography.</strong> In comparison mode, each state shows which operator has the higher average customer rating. In a single-network view, the map shows how that network's rating varies across states.</p>
          <p><strong>3. Detail.</strong> Select a state for exact values, then use the quality profile and call-setting breakdown to investigate the pattern.</p>
        </article>

        <article>
          <div className="section-kicker">Network view</div>
          <h2>One dashboard, two ways of asking the question.</h2>
          <p><strong>Compare Airtel + Jio:</strong> understand where customer-reported ratings differ and which network has the higher reported rating.</p>
          <p><strong>Airtel only / Jio only:</strong> focus on one network without forcing the user to compare it with another operator.</p>
        </article>

        <article>
          <div className="section-kicker">What the map means</div>
          <h2>Color carries a specific meaning.</h2>
          <div className="about-view__legend-row"><span className="about-view__swatch about-view__swatch--airtel" /> Airtel has the higher reported average rating</div>
          <div className="about-view__legend-row"><span className="about-view__swatch about-view__swatch--jio" /> Jio has the higher reported average rating</div>
          <div className="about-view__legend-row"><span className="about-view__swatch about-view__swatch--neutral" /> Average ratings are similar</div>
          <div className="about-view__legend-row"><span className="about-view__hatch" /> Limited feedback</div>
          <p className="about-view__note">In a single-network view, darker states indicate higher reported average ratings for the selected network. Color is not used to mean "good" or "bad".</p>
        </article>

        <article>
          <div className="section-kicker">What each measure means</div>
          <h2>Use the numbers without guessing.</h2>
          <p><strong>Customer reports:</strong> the number of customer-submitted voice-call reports represented by the current filters.</p>
          <p><strong>Average customer rating:</strong> the reported overall call-quality score, on a 0–5 scale.</p>
          <p><strong>Dropped-call reports:</strong> the share of reports classified as dropped calls. Lower is a smaller share of dropped-call reports.</p>
          <p><strong>Poor voice-quality reports:</strong> the share of reports classified as poor voice quality. Lower is a smaller share of those reports.</p>
        </article>

        <article>
          <div className="section-kicker">What this doesn't show</div>
          <h2>Reported patterns are not explanations.</h2>
          <p>These are customer reports, not a census of every call. Who chooses to submit feedback can influence the pattern. Rural areas or people with poor connectivity may also be underrepresented.</p>
          <p>The dashboard does not establish why a difference exists, and it does not include factors such as price, plan type, device type, or every aspect of network coverage.</p>
        </article>

        <article>
          <div className="section-kicker">Where this came from</div>
          <h2>Trace the numbers back to the data.</h2>
          <p>Customer-reported voice-call quality data for Airtel and Jio, covering the years available to the dashboard filters. The API exposes ratings, call-setting context, call-drop classifications, poor-voice classifications, location, and date.</p>
          <p>State boundaries used by the map come from DataMeet's India administrative boundaries. Rows with invalid rating, year, or region values were excluded during ingestion rather than silently corrected.</p>
          <p className="about-view__note">The final submission should record the dataset source, licence, access date, version, and any preparation or transformation steps used before the dashboard.</p>
        </article>
      </section>
    </main>
  );
}
