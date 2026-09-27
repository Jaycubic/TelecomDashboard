// src/components/Header/Header.tsx
import type { ThemeMode } from '../../hooks/useTheme';
import './Header.css';

interface HeaderProps {
  loading: boolean;
  error: string | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function Header({ loading, error, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1 className="header__title">Airtel vs Jio: call quality</h1>
        <p className="header__subtitle">
          Customer-reported voice quality across India, 2021–2025
        </p>
      </div>
      <div className="header__right">
        <div className="header__status" role="status" aria-live="polite">
          {error ? (
            <span className="header__status--error">{error}</span>
          ) : loading ? (
            <span className="header__status--loading">Updating…</span>
          ) : (
            <span className="header__status--ok">Up to date</span>
          )}
        </div>
        <button
          type="button"
          className="header__theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
        </button>
      </div>
    </header>
  );
}
