import type { ThemeMode } from '../../hooks/useTheme';
import './TopBar.css';

type DashboardView = 'overview' | 'about';

interface TopBarProps {
  loading: boolean;
  error: string | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

export function TopBar({ loading, error, theme, onToggleTheme, activeView, onViewChange }: TopBarProps) {
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
            <div className="topbar__sub">Customer-reported voice-call experience · Airtel + Jio</div>
          </div>
        </div>

        <nav className="topbar__nav" aria-label="Dashboard sections">
          <button
            type="button"
            className={`topbar__nav-btn ${activeView === 'overview' ? 'is-active' : ''}`}
            onClick={() => onViewChange('overview')}
            aria-current={activeView === 'overview' ? 'page' : undefined}
          >
            Overview
          </button>
          <button
            type="button"
            className={`topbar__nav-btn ${activeView === 'about' ? 'is-active' : ''}`}
            onClick={() => onViewChange('about')}
            aria-current={activeView === 'about' ? 'page' : undefined}
          >
            About
          </button>
        </nav>

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
