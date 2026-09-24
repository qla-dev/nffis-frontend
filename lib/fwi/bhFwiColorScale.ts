import { EFFIS_FWI_COLOR_STOPS, EFFIS_FWI_CSS_GRADIENT } from './effisFwiScale';

export const BH_FWI_COLOR_SCALE_NAME = 'effis-fwi-2021';

export const BH_FWI_COLOR_STOPS = EFFIS_FWI_COLOR_STOPS;

export const BH_FWI_CSS_GRADIENT = EFFIS_FWI_CSS_GRADIENT;

// A stable raster envelope prevents the color surface from changing whenever
// the user pans or zooms the map. It covers BiH with a small visual margin.
export const BH_FWI_RASTER_BOUNDS = {
  west: 15.5,
  east: 19.85,
  south: 42.35,
  north: 45.5,
} as const;
