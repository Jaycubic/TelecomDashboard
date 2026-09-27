// src/components/TopBar/TopBar.tsx
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
    <div className="topbar">
      <div className="topbar__inner">
        <div className="topbar__brand">
          <span className="topbar__signal">
            <span className="topbar__dot topbar__dot--airtel" />
            <span className="topbar__dot topbar__dot--jio" />
          </span>
          <span className="topbar__wordmark">Signal Strength</span>
          <span className="topbar__sub">Airtel vs Jio · India · 2021–2025</span>
        </div>

        <div className="topbar__controls">
          <div className="topbar__status" role="status" aria-live="polite">
            {error ? (
              <span className="topbar__status-error">{error}</span>
            ) : loading ? (
              <span className="topbar__status-loading">
                <span className="topbar__spinner" aria-hidden="true" />
                Updating
              </span>
            ) : null}
          </div>

          <button
            type="button"
            className="topbar__theme-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
