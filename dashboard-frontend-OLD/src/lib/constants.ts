// src/lib/constants.ts

// Vermillion/blue: one of the few hue pairs that stays distinguishable
// across protanopia, deuteranopia and tritanopia. Never used as the only
// signal though -- the map adds a hatch pattern for low-confidence
// states, and the radar/bars always carry a text label too.
export const OPERATOR_COLOR: Record<'Airtel' | 'Jio', string> = {
  Airtel: '#D6472B',
  Jio: '#1B6FC9',
};

export const OPERATOR_COLOR_SOFT: Record<'Airtel' | 'Jio', string> = {
  Airtel: '#F3D6CF',
  Jio: '#CFE1F3',
};

export const REGIONS = ['North', 'West', 'East', 'South'] as const;

export const CONFIDENCE_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Low sample (under 30 reports) — read with caution',
  medium: 'Medium sample (30–99 reports)',
  high: 'High sample (100+ reports)',
};
