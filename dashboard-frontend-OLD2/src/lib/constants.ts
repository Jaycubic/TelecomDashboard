// src/lib/constants.ts

// Vermillion/blue: one of the few hue pairs that stays distinguishable
// across protanopia, deuteranopia and tritanopia. Never used as the only
// signal though -- the map adds a hatch pattern for low-confidence
// states, and the radar/bars always carry a text label (and Jio's line
// is dashed) too. These are IDENTITY colors (this is Airtel, this is
// Jio) -- kept separate from the semantic "good/warn/bad" colors below,
// which mean something different (an outcome is better or worse) and
// must never be confused with "which operator is this."
export const OPERATOR_COLOR: Record<'Airtel' | 'Jio', string> = {
  Airtel: '#D6472B',
  Jio: '#1B6FC9',
};

export const OPERATOR_COLOR_SOFT: Record<'Airtel' | 'Jio', string> = {
  Airtel: '#F3D6CF',
  Jio: '#CFE1F3',
};

// Semantic colors: what an outcome MEANS, independent of who owns it.
// Used for "ahead / about the same" badges in the comparison table --
// never for telling Airtel and Jio apart, and never on the map (the map
// is a two-way lead, not a good/bad axis).
export const SEMANTIC_COLOR = {
  good: 'var(--color-good)',
  warn: 'var(--color-warn)',
  bad: 'var(--color-bad)',
  neutral: 'var(--color-neutral)',
} as const;

// Colors recharts needs as literal strings (SVG attributes can't read
// CSS custom properties), keyed by the active theme.
export const CHART_THEME = {
  light: { axis: '#5A5E68', grid: '#DCDCD6', noData: '#E4E4DF', mapStroke: '#ffffff', hatch: '#8b8b85' },
  dark: { axis: '#9AA1B0', grid: '#2C303C', noData: '#262A35', mapStroke: '#12141A', hatch: '#6b7180' },
} as const;

export const REGIONS = ['North', 'West', 'East', 'South'] as const;

// Plain-language sample-size labels. Never surface "n=" or "sample size"
// in the UI itself -- this is for tooltips/titles only.
export const CONFIDENCE_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Limited feedback (fewer than 30 reports) — treat this as directional, not conclusive',
  medium: 'Some feedback (30–99 reports)',
  high: 'Plenty of feedback (100+ reports)',
};
