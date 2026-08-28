// Builds a leaflet-velocity compatible u/v grid for the BiH region out of Open-Meteo
// point forecasts. Open-Meteo has no gridded GRIB endpoint on the free tier, so we
// sample a regular lat/lon lattice in a single batched request and assemble the grid
// ourselves in the layout leaflet-velocity expects (row-major, first row = north edge).

import { pointInPreparedMask, prepareMaskPolygons } from '../lib/gis/geoMask';

// Region covers BiH plus a margin; cells outside the supplied BiH mask are null.
const LON_MIN = 15.4;
const LON_MAX = 20.2;
const LAT_MIN = 42.2;
const LAT_MAX = 45.5;
const STEP = 0.3; // ~33 km; matches the resolution of the underlying weather model closely enough

export const WIND_REFRESH_MS = 10 * 60 * 1000; // Open-Meteo advances "current" every 15 min

export interface VelocityRecord {
  header: Record<string, unknown>;
  data: Array<number | null>;
}

function gridAxis(min: number, max: number): number[] {
  const count = Math.floor((max - min) / STEP) + 1;

  return Array.from({ length: count }, (_, index) => Number((min + index * STEP).toFixed(4)));
}

interface OpenMeteoPoint {
  current?: {
    time?: string;
    wind_speed_10m?: number | null;
    wind_direction_10m?: number | null;
  };
}

export async function fetchWindGrid(mask?: GeoJSON.FeatureCollection, signal?: AbortSignal): Promise<VelocityRecord[]> {
  const lons = gridAxis(LON_MIN, LON_MAX);
  // North to south: leaflet-velocity walks rows downward from la1.
  const lats = gridAxis(LAT_MIN, LAT_MAX).reverse();

  const latParam: number[] = [];
  const lonParam: number[] = [];

  for (const lat of lats) {
    for (const lon of lons) {
      latParam.push(lat);
      lonParam.push(lon);
    }
  }

  const url =
    'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${latParam.join(',')}`
    + `&longitude=${lonParam.join(',')}`
    + '&current=wind_speed_10m,wind_direction_10m'
    + '&wind_speed_unit=ms';

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Open-Meteo wind request failed with ${response.status}`);
  }

  const payload = await response.json();
  const points: OpenMeteoPoint[] = Array.isArray(payload) ? payload : [payload];

  if (points.length !== latParam.length) {
    throw new Error(`Open-Meteo returned ${points.length} points, expected ${latParam.length}`);
  }

  const uData: Array<number | null> = [];
  const vData: Array<number | null> = [];
  const maskPolygons = prepareMaskPolygons(mask);

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (maskPolygons.length > 0 && !pointInPreparedMask(lonParam[index], latParam[index], maskPolygons)) {
      uData.push(null);
      vData.push(null);
      continue;
    }
    const speed = point.current?.wind_speed_10m;
    const direction = point.current?.wind_direction_10m;

    if (typeof speed !== 'number' || typeof direction !== 'number') {
      uData.push(0);
      vData.push(0);
      continue;
    }

    // Meteorological convention: direction is where the wind blows FROM.
    const radians = (direction * Math.PI) / 180;
    uData.push(Number((-speed * Math.sin(radians)).toFixed(3)));
    vData.push(Number((-speed * Math.cos(radians)).toFixed(3)));
  }

  const refTime = points[0]?.current?.time
    ? new Date(`${points[0].current.time}Z`).toISOString()
    : new Date().toISOString();

  const baseHeader = {
    parameterUnit: 'm.s-1',
    parameterCategory: 2,
    nx: lons.length,
    ny: lats.length,
    lo1: lons[0],
    la1: lats[0], // northern edge
    dx: STEP,
    dy: STEP,
    refTime,
    forecastTime: 0,
  };

  return [
    {
      header: { ...baseHeader, parameterNumber: 2, parameterNumberName: 'eastward_wind' },
      data: uData,
    },
    {
      header: { ...baseHeader, parameterNumber: 3, parameterNumberName: 'northward_wind' },
      data: vData,
    },
  ];
}
