// src/components/UtilityBar/UtilityBar.tsx
// Replaces the old full-height Header. A dashboard whose whole point is
// "look at this map and these numbers" doesn't need a permanent banner
// repeating the title the person already knows they opened -- so this is
// a thin utility strip: just enough to say the data is current and let
// the person flip the theme. The actual title now lives in the hero,
// as page content rather than fixed chrome.
import type { ThemeMode } from '../../hooks/useTheme';
import './UtilityBar.css';

interface UtilityBarProps {
  loading: boolean;
  error: string | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function UtilityBar({ loading, error, theme, onToggleTheme }: UtilityBarProps) {
  const statusLabel = error ? error : loading ? 'Updating…' : 'Up to date';
  const statusTone = error ? 'error' : loading ? 'loading' : 'ok';

  return (
    <div className="utility-bar">
      <span className="utility-bar__mark">
        <i className="utility-bar__mark-dot utility-bar__mark-dot--airtel" />
        <i className="utility-bar__mark-dot utility-bar__mark-dot--jio" />
        Call quality
      </span>

      <div className="utility-bar__right">
        <span
          className={`utility-bar__status utility-bar__status--${statusTone}`}
          role="status"
          aria-live="polite"
        >
          {statusTone !== 'error' && <i className="utility-bar__status-dot" />}
          {statusLabel}
        </span>
        <button
          type="button"
          className="utility-bar__theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <span aria-hidden="true">{theme === 'light' ? '\u263E' : '\u2600'}</span>
        </button>
      </div>
    </div>
  );
}
