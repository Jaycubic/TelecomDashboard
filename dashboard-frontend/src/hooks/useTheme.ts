// src/hooks/useTheme.ts
import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    // Check localStorage first, default to dark for this premium product
    const stored = typeof window !== 'undefined' ? localStorage.getItem('signal-theme') : null;
    if (stored === 'light' || stored === 'dark') return stored;
    // Respect system preference, default to dark if no preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('signal-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
