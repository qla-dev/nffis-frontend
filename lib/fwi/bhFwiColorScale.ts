export const BH_FWI_COLOR_SCALE_NAME = 'nffis-bh-fwi';

export const BH_FWI_COLOR_STOPS = [
  { position: 0, value: 0, color: '#22c55e' },
  { position: 0.5, value: 40, color: '#f97316' },
  { position: 1, value: 80, color: '#ef4444' },
] as const;

export const BH_FWI_CSS_GRADIENT = `linear-gradient(to right, ${BH_FWI_COLOR_STOPS
  .map((stop) => `${stop.color} ${stop.position * 100}%`)
  .join(', ')})`;

// A stable raster envelope prevents the color surface from changing whenever
// the user pans or zooms the map. It covers BiH with a small visual margin.
export const BH_FWI_RASTER_BOUNDS = {
  west: 15.5,
  east: 19.85,
  south: 42.35,
  north: 45.5,
} as const;
