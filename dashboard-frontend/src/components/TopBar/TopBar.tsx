import type { ThemeMode } from '../../hooks/useTheme';
import './TopBar.css';

interface TopBarProps {
  loading: boolean;
  error: string | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function TopBar({ loading, error, theme, onToggleTheme }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__brand" aria-label="Call quality dashboard">
          <div className="topbar__mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="topbar__wordmark">Call Quality</div>
            <div className="topbar__sub">Airtel vs Jio · customer-reported voice experience</div>
          </div>
        </div>

        <div className="topbar__actions">
          <div className="topbar__status" role="status" aria-live="polite">
            {error ? (
              <span className="topbar__status-error">Data connection issue</span>
            ) : loading ? (
              <span className="topbar__status-loading"><span className="topbar__spinner" /> Updating</span>
            ) : (
              <span className="topbar__status-ready"><span /> Live data</span>
            )}
          </div>
          <button
            type="button"
            className="topbar__theme-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '◐'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
