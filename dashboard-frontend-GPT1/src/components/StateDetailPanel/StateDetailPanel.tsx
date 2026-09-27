import type { CarrierVisibility } from '../../hooks/useDashboardState';
import type { ConfidenceRow, StateQualityRow } from '../../types';
import { formatNumber, formatPct, toNumber } from '../../lib/format';
import { metricLeader } from '../../lib/analysis';
import './StateDetailPanel.css';

interface StateDetailPanelProps {
  stateRows: StateQualityRow[];
  confidenceRows: ConfidenceRow[];
  selectedState: string | undefined;
  carrierVisibility: CarrierVisibility;
  onClear: () => void;
}

export function StateDetailPanel({
  stateRows,
  confidenceRows,
  selectedState,
  carrierVisibility,
  onClear,
}: StateDetailPanelProps) {
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;
  const stateRowsForSelection = selectedState
    ? stateRows.filter((row) => row.state_name === selectedState)
    : [];
  const airtel = stateRowsForSelection.find((row) => row.operator === 'Airtel');
  const jio = stateRowsForSelection.find((row) => row.operator === 'Jio');
  const selectedOperator = carrierVisibility.Airtel ? 'Airtel' : 'Jio';
  const selectedRow = selectedOperator === 'Airtel' ? airtel : jio;

  const av = toNumber(airtel?.avg_rating);
  const jv = toNumber(jio?.avg_rating);
  const leader = bothVisible ? metricLeader(av, jv, 'higherIsBetter', 0.05) : null;
  const confidence = selectedState
    ? confidenceRows.filter((row) => row.state_name === selectedState && (!bothVisible ? row.operator === selectedOperator : true))
    : [];
  const reports = bothVisible
    ? (toNumber(airtel?.total_reports) ?? 0) + (toNumber(jio?.total_reports) ?? 0)
    : toNumber(selectedRow?.total_reports) ?? 0;

  return (
    <section className="state-detail">
      <div className="state-detail__head">
        <div>
          <div className="section-kicker">State detail</div>
          <h3>{selectedState ?? 'Explore a state'}</h3>
        </div>
        {selectedState && (
          <button className="state-detail__clear" type="button" onClick={onClear}>Clear</button>
        )}
      </div>

      {!selectedState ? (
        <div className="state-detail__empty">
          <p>Choose a state on the map to inspect its customer-reported voice experience.</p>
          <span>{bothVisible ? 'In comparison view, you will see Airtel and Jio side by side.' : `In ${selectedOperator} view, you will see the reported rating and call-quality measures for ${selectedOperator}.`}</span>
        </div>
      ) : (
        <>
          <div className="state-detail__summary">
            <div>
              <span className="state-detail__label">Customer reports</span>
              <strong>{formatNumber(reports)}</strong>
            </div>
            <div>
              <span className="state-detail__label">Rating view</span>
              <strong>
                {bothVisible
                  ? leader === 'Airtel'
                    ? 'Airtel higher'
                    : leader === 'Jio'
                      ? 'Jio higher'
                      : leader === 'similar'
                        ? 'Similar ratings'
                        : 'Not comparable'
                  : `${selectedOperator} · ${toNumber(selectedRow?.avg_rating)?.toFixed(2) ?? '—'} / 5`}
              </strong>
            </div>
          </div>

          <div className="state-detail__metrics">
            {bothVisible ? (
              <>
                <ComparisonLine label="Average rating" airtel={av == null ? '—' : `${av.toFixed(2)} / 5`} jio={jv == null ? '—' : `${jv.toFixed(2)} / 5`} />
                <ComparisonLine label="Dropped-call reports" airtel={formatPct(airtel?.call_drop_pct)} jio={formatPct(jio?.call_drop_pct)} />
                <ComparisonLine label="Poor voice-quality reports" airtel={formatPct(airtel?.poor_voice_pct)} jio={formatPct(jio?.poor_voice_pct)} />
              </>
            ) : (
              <>
                <SingleLine label="Average customer rating" value={avOrJio(av, jv, selectedOperator)} />
                <SingleLine label="Dropped-call reports" value={formatPct(selectedRow?.call_drop_pct)} />
                <SingleLine label="Poor voice-quality reports" value={formatPct(selectedRow?.poor_voice_pct)} />
              </>
            )}
          </div>

          {confidence.length > 0 && (
            <p className="state-detail__confidence">
              {confidence.some((row) => row.confidence === 'low')
                ? 'Limited feedback in this state: use the rating as a directional signal, not a precise estimate.'
                : 'This state has more than the minimum feedback threshold used by the dashboard for confidence marking.'}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function avOrJio(av: number | null, jv: number | null, selectedOperator: 'Airtel' | 'Jio') {
  const value = selectedOperator === 'Airtel' ? av : jv;
  return value == null ? '—' : `${value.toFixed(2)} / 5`;
}

function ComparisonLine({ label, airtel, jio }: { label: string; airtel: string; jio: string }) {
  return (
    <div className="state-detail__line">
      <span>{label}</span>
      <strong><i className="legend-dot legend-dot--airtel" />{airtel}</strong>
      <strong><i className="legend-dot legend-dot--jio" />{jio}</strong>
    </div>
  );
}

function SingleLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="state-detail__line state-detail__line--single">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
