import './ContextFooter.css';

export function ContextFooter() {
  return (
    <footer className="ctx-footer">
      <div className="ctx-footer__intro">
        <div className="section-kicker">Read the data with context</div>
        <h2>What the dashboard can — and cannot — tell you</h2>
      </div>
      <div className="ctx-footer__grid">
        <div className="ctx-footer__cell">
          <p className="ctx-footer__heading">What is shown</p>
          <p className="ctx-footer__body">Customer-reported voice-call quality across Airtel and Jio, using ratings, call-drop classifications, poor-voice classifications, call setting, state, and date filters available from the dashboard API.</p>
        </div>
        <div className="ctx-footer__cell">
          <p className="ctx-footer__heading">How to read the map</p>
          <p className="ctx-footer__body">Airtel or Jio coloring means that operator has the higher average customer rating in the current state view. A neutral state means the ratings are close. Hatching marks states with limited feedback.</p>
        </div>
        <div className="ctx-footer__cell">
          <p className="ctx-footer__heading">Important limitation</p>
          <p className="ctx-footer__body">These are customer reports, not a census of every call. Differences can reflect who submitted feedback as well as network experience. The dashboard does not establish why a difference exists.</p>
        </div>
      </div>
    </footer>
  );
}
