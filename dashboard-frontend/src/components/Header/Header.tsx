// src/components/Header/Header.tsx
import './Header.css';

interface HeaderProps {
  loading: boolean;
  error: string | null;
}

export function Header({ loading, error }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1 className="header__title">Airtel vs Jio: call quality</h1>
        <p className="header__subtitle">
          Customer-reported voice quality across India, 2021–2025
        </p>
      </div>
      <div className="header__status" role="status" aria-live="polite">
        {error ? (
          <span className="header__status--error">{error}</span>
        ) : loading ? (
          <span className="header__status--loading">Updating…</span>
        ) : (
          <span className="header__status--ok">Up to date</span>
        )}
      </div>
    </header>
  );
}
