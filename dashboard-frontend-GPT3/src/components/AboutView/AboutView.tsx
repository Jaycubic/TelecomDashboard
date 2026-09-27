import './AboutView.css';

export function AboutView() {
  return (
    <main className="about-view">
      <section className="about-view__hero">
        <div className="section-kicker">About this dashboard</div>
        <h1>Customer-reported call quality, made easier to compare.</h1>
        <p>
          This dashboard brings Airtel and Jio voice-quality reports into one view so a normal reader can move from the national picture to the states where the experiences diverge.
        </p>
      </section>

      <section className="about-view__grid">
        <article>
          <div className="section-kicker">What comes first</div>
          <h2>Read the story in three steps.</h2>
          <p><strong>1. Snapshot.</strong> The top comparison card gives the national report volume and the three headline signals.</p>
          <p><strong>2. Geography.</strong> The India map shows which operator has the higher reported average rating in each state.</p>
          <p><strong>3. Detail.</strong> The state-gap list and performance profile show where the differences are largest and how the experience changes across dimensions.</p>
        </article>

        <article>
          <div className="section-kicker">How to read the map</div>
          <h2>Color means operator identity.</h2>
          <div className="about-view__legend-row"><span className="about-view__swatch about-view__swatch--airtel" /> Airtel higher reported rating</div>
          <div className="about-view__legend-row"><span className="about-view__swatch about-view__swatch--jio" /> Jio higher reported rating</div>
          <div className="about-view__legend-row"><span className="about-view__swatch about-view__swatch--neutral" /> Ratings are close</div>
          <div className="about-view__legend-row"><span className="about-view__hatch" /> Limited feedback</div>
          <p className="about-view__note">The map does not use green/red to imply good or bad. It answers one specific comparison question: which operator has the higher reported average rating in the current view?</p>
        </article>

        <article>
          <div className="section-kicker">Metrics</div>
          <h2>What each number means.</h2>
          <p><strong>Average rating:</strong> the customer-reported overall call-quality score, shown on a 0–5 scale.</p>
          <p><strong>Call drops:</strong> the share of reports classified as dropped calls. Lower is better.</p>
          <p><strong>Poor voice:</strong> the share of reports classified as poor voice quality. Lower is better.</p>
          <p><strong>Performance profile:</strong> multiple API-provided quality dimensions are normalized only for the radar's visual scale; the underlying values are not replaced.</p>
        </article>

        <article>
          <div className="section-kicker">Interaction</div>
          <h2>Filters stay visible, not hidden.</h2>
          <p>Operator visibility, state and year range sit directly below the opening comparison so the reader always knows what the numbers and map represent.</p>
          <p>Clicking a state on the map or selecting it in the filter focuses the dashboard on that location. Reset returns the view to the full dataset range.</p>
        </article>

        <article className="about-view__wide">
          <div className="section-kicker">Limitations</div>
          <h2>What the data cannot prove.</h2>
          <p>These are customer reports, not a census of every call. Differences can reflect who submitted feedback as well as the network experience itself. The dashboard describes reported patterns; it does not establish why those differences exist.</p>
        </article>
      </section>
    </main>
  );
}
