import './AboutView.css';

interface AboutViewProps { onBack: () => void; }

export function AboutView({ onBack }: AboutViewProps) {
  return (
    <main className="about-view">
      <div className="about-view__topline"><button type="button" onClick={onBack}>← Back to reviews</button><span>Voice Call Quality Reviews</span></div>
      <section className="about-view__hero">
        <div className="about-view__meta">Data current to: 2025</div>
        <h1>About the data</h1>
        <p>This dashboard turns customer-reported voice-call reviews into a geographic comparison of Airtel and Jio, while also allowing a single-network view.</p>
      </section>
      <section className="about-view__grid">
        <article>
          <div className="about-view__kicker">How to read this</div>
          <h2>Start with the summary, then use the map.</h2>
          <p><strong>1. Choose a view.</strong> Overview compares Airtel and Jio. Airtel or Jio focuses on one operator.</p>
          <p><strong>2. Set scope.</strong> Choose a state or union territory and move both year handles together for a single year, or apart for a multi-year view.</p>
          <p><strong>3. Read the map.</strong> In Overview, color shows which operator has the higher average rating. In a single-network view, lighter to darker operator color shows lower to higher reported average rating.</p>
        </article>
        <article>
          <div className="about-view__kicker">What each measure means</div>
          <h2>Use the numbers without guessing.</h2>
          <p><strong>Total Customer Reviews:</strong> customer-submitted voice-call reviews represented by the active filters.</p>
          <p><strong>Avg Rating:</strong> mean of the 1–5 user rating in the selected records.</p>
          <p><strong>Call Drop Rate:</strong> share of selected reviews whose source category is “Call Dropped”.</p>
          <p><strong>Voice Degradation Rate:</strong> share of selected reviews whose source category is “Poor Voice Quality”.</p>
        </article>
        <article>
          <div className="about-view__kicker">What this doesn’t show</div>
          <h2>A reported pattern is not a complete network diagnosis.</h2>
          <p>The data contains customer-submitted reviews, so reporting behavior can influence what appears in the dataset. The dashboard does not represent every call, every customer, or every place equally.</p>
          <p>The dashboard also does not establish why an observed difference exists. It does not include every possible driver of network experience, such as plan, device, terrain, or infrastructure detail.</p>
          <p>The supplied Jio records do not cover every year represented by the Airtel data, so a comparison across the full 2017–2025 range should be read with that availability difference in mind.</p>
        </article>
        <article>
          <div className="about-view__kicker">Where this came from</div>
          <h2>Government open data, transformed for comparison.</h2>
          <p><strong>Source:</strong> <a href="https://www.data.gov.in/" target="_blank" rel="noreferrer">data.gov.in</a></p>
          <p><strong>Dataset family:</strong> Voice Call Quality Customer Experience · Publisher: Telecom Regulatory Authority of India (TRAI).</p>
          <p><strong>Accessed:</strong> 29 September 2026 · <strong>Licence:</strong> Government Open Data License — India.</p>
          <p><strong>Preparation:</strong> Airtel and Jio records were combined without creating new observations. Text categories were counted to derive percentage measures. Location aliases were normalized to current state/union-territory names for filtering and mapping.</p>
        </article>
      </section>
    </main>
  );
}
