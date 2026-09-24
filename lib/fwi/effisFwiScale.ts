export const EFFIS_FWI_CLASSIFICATION_VERSION = 'effis-europe-v2-2021';
export const EFFIS_FWI_DISPLAY_MAX = 80;

export const EFFIS_FWI_CLASSES = [
  { key: 'low', label: 'Low', min: 0, max: 11.2, color: '#22c55e' },
  { key: 'moderate', label: 'Moderate', min: 11.2, max: 21.3, color: '#eab308' },
  { key: 'high', label: 'High', min: 21.3, max: 38, color: '#f97316' },
  { key: 'very_high', label: 'Very high', min: 38, max: 50, color: '#ef4444' },
  { key: 'extreme', label: 'Extreme', min: 50, max: 70, color: '#991b1b' },
  { key: 'very_extreme', label: 'Very extreme', min: 70, max: null, color: '#6b21a8' },
] as const;

export const EFFIS_FWI_TICKS = [0, 11.2, 21.3, 38, 50, 70, 80] as const;

export function classifyEffisFwi(value: number) {
  return EFFIS_FWI_CLASSES.find(item => item.max === null || value < item.max || (item.key === 'extreme' && value <= item.max)) ?? EFFIS_FWI_CLASSES.at(-1)!;
}

// Continuous visual anchors. The ticks still mark the official EFFIS class
// boundaries, while values between them blend smoothly on rasters and legends.
export const EFFIS_FWI_COLOR_STOPS = [
  ...EFFIS_FWI_CLASSES.map(item => ({
    position: item.min / EFFIS_FWI_DISPLAY_MAX,
    value: item.min,
    color: item.color,
  })),
  { position: 1, value: EFFIS_FWI_DISPLAY_MAX, color: '#4c1d95' },
] as const;

export function effisFwiGradientColor(value: number): string {
  const clamped = Math.max(0, Math.min(EFFIS_FWI_DISPLAY_MAX, value));
  const upperIndex = EFFIS_FWI_COLOR_STOPS.findIndex(stop => clamped <= stop.value);
  if (upperIndex <= 0) return EFFIS_FWI_COLOR_STOPS[0].color;
  const upper = EFFIS_FWI_COLOR_STOPS[upperIndex];
  const lower = EFFIS_FWI_COLOR_STOPS[upperIndex - 1];
  const ratio = (clamped - lower.value) / Math.max(Number.EPSILON, upper.value - lower.value);
  const rgb = [1, 3, 5].map(offset => Math.round(
    Number.parseInt(lower.color.slice(offset, offset + 2), 16)
    + (Number.parseInt(upper.color.slice(offset, offset + 2), 16) - Number.parseInt(lower.color.slice(offset, offset + 2), 16)) * ratio,
  ));
  return `#${rgb.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
}

export const EFFIS_FWI_CSS_GRADIENT = `linear-gradient(to right, ${EFFIS_FWI_COLOR_STOPS
  .map(stop => `${stop.color} ${stop.position * 100}%`)
  .join(', ')})`;
