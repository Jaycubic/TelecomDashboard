// src/lib/constants.ts

// Operator identity colors — never reused as semantic good/bad signals.
// Ember/cobalt pair stays distinguishable across protanopia, deuteranopia, tritanopia.
export const OPERATOR_COLOR: Record<'Airtel' | 'Jio', string> = {
  Airtel: '#E8553E',
  Jio:    '#3D8EF0',
};

export const OPERATOR_COLOR_SOFT: Record<'Airtel' | 'Jio', string> = {
  Airtel: 'rgba(232,85,62,0.15)',
  Jio:    'rgba(61,142,240,0.15)',
};

// Chart rendering helpers — recharts needs literal strings, not CSS variables
export const CHART_THEME = {
  light: {
    axis:      '#6B7280',
    grid:      'rgba(0,0,0,0.08)',
    noData:    '#E5E7EB',
    mapStroke: '#FFFFFF',
    hatch:     '#9CA3AF',
  },
  dark: {
    axis:      '#5A6175',
    grid:      'rgba(255,255,255,0.06)',
    noData:    '#1A2332',
    mapStroke: '#0D1117',
    hatch:     '#2C3548',
  },
} as const;

export const REGIONS = ['North', 'West', 'East', 'South'] as const;

export const CONFIDENCE_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low:    'Limited feedback (fewer than 30 reports) — treat as directional',
  medium: 'Some feedback (30–99 reports)',
  high:   'Plenty of feedback (100+ reports)',
};
