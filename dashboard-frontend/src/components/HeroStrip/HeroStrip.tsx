import type { KpiResponse, FilterOptionsResponse } from '../../types';
import type { ReactNode } from 'react';
import type { CarrierVisibility } from '../../hooks/useDashboardState';
import { buildMetricSummaries } from '../../lib/analysis';
import { toNumber } from '../../lib/format';
import { InfoPopover } from '../InfoPopover/InfoPopover';
import type { ThemeMode } from '../../hooks/useTheme';
import './HeroStrip.css';

interface HeroStripProps {
  kpis: KpiResponse | null;
  filterOptions: FilterOptionsResponse | null;
  selectedState: string | undefined;
  yearRange: [number, number];
  loading: boolean;
  error: string | null;
  carrierVisibility: CarrierVisibility;
  onCarrierVisibilityChange: (visibility: CarrierVisibility) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenAbout: () => void;
}

type ViewMode = 'compare' | 'Airtel' | 'Jio';

export function HeroStrip({
  kpis,
  filterOptions,
  selectedState,
  yearRange,
  loading,
  error,
  carrierVisibility,
  onCarrierVisibilityChange,
  theme,
  onToggleTheme,
  onOpenAbout,
}: HeroStripProps) {
  const metrics = buildMetricSummaries(kpis?.kpis ?? []);
  const rating = metrics.find((m) => m.key === 'avg_rating');
  const drops = metrics.find((m) => m.key === 'call_drop_pct');
  const poorVoice = metrics.find((m) => m.key === 'poor_voice_pct');
  const airtel = kpis?.kpis.find((r) => r.operator === 'Airtel');
  const jio = kpis?.kpis.find((r) => r.operator === 'Jio');
  const bothVisible = carrierVisibility.Airtel && carrierVisibility.Jio;
  const selectedOperator = carrierVisibility.Airtel ? 'Airtel' : 'Jio';
  const selectedRow = selectedOperator === 'Airtel' ? airtel : jio;
  const reports = bothVisible
    ? (toNumber(airtel?.total_reports) ?? 0) + (toNumber(jio?.total_reports) ?? 0)
    : toNumber(selectedRow?.total_reports) ?? 0;
  const viewMode: ViewMode = bothVisible ? 'compare' : selectedOperator;
  const totalRecords = toNumber(filterOptions?.total_records) ?? 0;
  const accessLabel = selectedState ?? 'All India';
  const yearLabel = yearRange[0] === yearRange[1] ? String(yearRange[0]) : `${yearRange[0]}–${yearRange[1]}`;
  const latestYear = filterOptions?.year_max ?? 2025;

  const setView = (mode: ViewMode) => {
    if (mode === 'compare') onCarrierVisibilityChange({ Airtel: true, Jio: true });
    else onCarrierVisibilityChange({ Airtel: mode === 'Airtel', Jio: mode === 'Jio' });
  };

  return (
    <section className="hero" aria-label="Dashboard overview">
      <div className="hero__inner">
        <div className="hero__copy">
          <div className="hero__meta">
            <span>Data current to: {latestYear}</span>
            <button type="button" className="hero__about-link" onClick={onOpenAbout}>About the data</button>
            {error && <span className="hero__status" role="status">Data connection issue</span>}
          </div>
          <h1>Voice Call Quality Reviews</h1>
          <p className="sr-only">Customer-reported voice-call quality data for Airtel and Jio in India.</p>

          <div className="hero__network" role="group" aria-label="Choose the dashboard view">
            <ViewButton mode="compare" active={viewMode === 'compare'} onClick={() => setView('compare')}>
              Overview
            </ViewButton>
            <ViewButton mode="Airtel" active={viewMode === 'Airtel'} onClick={() => setView('Airtel')}>
              Airtel
            </ViewButton>
            <ViewButton mode="Jio" active={viewMode === 'Jio'} onClick={() => setView('Jio')}>
              Jio
            </ViewButton>
          </div>
          <div className="hero__context">{accessLabel} · {yearLabel}</div>
        </div>

        <div className="hero__right">
          <button type="button" className="theme-button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Toggle theme">
            {theme === 'dark' ? '◐' : '◑'}
          </button>
          <div className="hero__facts" aria-label="Current filtered summary">
            <Fact
              strong={loading ? '—' : bothVisible ? <>
                <span className="metric-airtel">{(toNumber(airtel?.total_reports) ?? 0).toLocaleString('en-IN')}</span> <em>vs</em> <span className="metric-jio">{(toNumber(jio?.total_reports) ?? 0).toLocaleString('en-IN')}</span>
              </> : reports.toLocaleString('en-IN')}
              label={bothVisible ? 'Total Customer Reviews · Airtel vs Jio' : 'Total Customer Reviews'}
              info={(
                <>
                  <p className="info-popover__title">Review Volume Matrix</p>
                  <p><strong>Current scope:</strong> {yearLabel} · {accessLabel}</p>
                  <p><strong>Reviews:</strong> {reports.toLocaleString('en-IN')} of {totalRecords.toLocaleString('en-IN')} total entries</p>
                  <p><strong>Airtel:</strong> {(toNumber(airtel?.total_reports) ?? 0).toLocaleString('en-IN')} reviews</p>
                  <p><strong>Jio:</strong> {(toNumber(jio?.total_reports) ?? 0).toLocaleString('en-IN')} reviews</p>
                  <p className="info-popover__note">Historical records between 2017–2019 feature more limited localized submissions. Review counts dynamically follow the active timeline and location filters.</p>
                </>
              )}
            />
            <Fact
              strong={loading ? '—' : bothVisible ? <><span className="metric-airtel">{rating?.airtel?.toFixed(2) ?? '—'}</span> <em>vs</em> <span className="metric-jio">{rating?.jio?.toFixed(2) ?? '—'}</span></> : `${selectedOperator} · ${ratingValue(selectedRow?.avg_rating)}`}
              label={bothVisible ? 'Avg Rating · Airtel vs Jio' : 'Avg Rating'}
              info={(
                <>
                  <p className="info-popover__title">Rating Aggregation Matrix</p>
                  <p><strong>Metric base:</strong> Mean user score across a 1–5 rating scale.</p>
                  <p><strong>Included records:</strong> All rating-bearing customer reviews in the active timeline and location scope.</p>
                  <p className="info-popover__formula"><strong>Calculation:</strong> Sum of selected ratings ÷ number of selected rating-bearing reviews.</p>
                  <p className="info-popover__note">Averages exclude periods with zero recorded interactions. The 1–5 rating is stored separately from the call-outcome category.</p>
                </>
              )}
            />
            <Fact
              strong={loading ? '—' : bothVisible ? <><span className="metric-airtel">{drops?.airtel?.toFixed(1) ?? '—'}%</span> <em>vs</em> <span className="metric-jio">{drops?.jio?.toFixed(1) ?? '—'}%</span></> : pctValue(selectedRow?.call_drop_pct)}
              label={bothVisible ? 'Call Drop Rate · Airtel vs Jio' : 'Call Drop Rate'}
              info={(
                <>
                  <p className="info-popover__title">Call Drop Frequency</p>
                  <p><strong>Metric type:</strong> Percentage derived from the source category labels.</p>
                  <p className="info-popover__formula"><strong>Formula:</strong> Count of “Call Dropped” reviews ÷ Total Customer Reviews × 100.</p>
                  <p className="info-popover__note">This is the share of selected customer reviews classified as “Call Dropped”. A lower percentage means fewer selected reviews fall into this category.</p>
                </>
              )}
            />
            <Fact
              strong={loading ? '—' : bothVisible ? <><span className="metric-airtel">{poorVoice?.airtel?.toFixed(1) ?? '—'}%</span> <em>vs</em> <span className="metric-jio">{poorVoice?.jio?.toFixed(1) ?? '—'}%</span></> : pctValue(selectedRow?.poor_voice_pct)}
              label={bothVisible ? 'Voice Degradation Rate · Airtel vs Jio' : 'Voice Degradation Rate'}
              info={(
                <>
                  <p className="info-popover__title">Voice Quality Degradation</p>
                  <p><strong>Metric type:</strong> Percentage derived from the source category labels.</p>
                  <p className="info-popover__formula"><strong>Formula:</strong> Count of “Poor Voice Quality” reviews ÷ Total Customer Reviews × 100.</p>
                  <p className="info-popover__note">This is the share of selected customer reviews classified as “Poor Voice Quality”. A lower percentage means fewer selected reviews fall into this category.</p>
                </>
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ViewButton({ mode, active, onClick, children }: { mode: ViewMode; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`view-button view-button--${mode.toLowerCase()} ${active ? 'is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Fact({
  strong,
  label,
  info,
}: {
  strong: ReactNode;
  label: string;
  info: ReactNode;
}) {
  return (
    <div className="hero-fact">
      <div className="hero-fact__value">{strong}</div>
      <div className="hero-fact__label"><span>{label}</span><InfoPopover label={`More information about ${label}`} align="right">{info}</InfoPopover></div>
    </div>
  );
}

function ratingValue(value: string | number | null | undefined) {
  const n = toNumber(value);
  return n == null ? '—' : `${n.toFixed(2)} / 5`;
}

function pctValue(value: string | number | null | undefined) {
  const n = toNumber(value);
  return n == null ? '—' : `${n.toFixed(1)}%`;
}
