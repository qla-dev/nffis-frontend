import { pointInPreparedMask, prepareMaskPolygons } from '../gis/geoMask';

export interface FwiRasterPoint {
  id: string;
  lat: number;
  lng: number;
}

export interface FwiRasterBounds {
  west: number;
  east: number;
  south: number;
  north: number;
}

export const FWI_RASTER_WIDTH = 512;
export const FWI_RASTER_HEIGHT = 512;
export const FWI_NO_DATA_VALUE = -9999;

const DEFAULT_PADDING = 0.3;

export function createFwiRasterSurface<TPoint extends FwiRasterPoint>(
  points: TPoint[],
  valueAccessor: (point: TPoint) => number,
  influenceRadius: number,
  rasterBounds?: FwiRasterBounds,
  rasterMask?: GeoJSON.FeatureCollection,
  cellValueTransform?: (value: number, lat: number, lng: number) => number,
  width = FWI_RASTER_WIDTH,
  height = FWI_RASTER_HEIGHT,
) {
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const pointValues = points.map(valueAccessor);
  const west = rasterBounds?.west ?? (Math.min(...longitudes) - DEFAULT_PADDING);
  const east = rasterBounds?.east ?? (Math.max(...longitudes) + DEFAULT_PADDING);
  const south = rasterBounds?.south ?? (Math.min(...latitudes) - DEFAULT_PADDING);
  const north = rasterBounds?.north ?? (Math.max(...latitudes) + DEFAULT_PADDING);
  const latSpan = north - south;
  const lngSpan = east - west;
  const data = new Float32Array(width * height);
  const maskPolygons = prepareMaskPolygons(rasterMask);
  const radiusDenominator = 2 * influenceRadius * influenceRadius;

  for (let y = 0; y < height; y += 1) {
    const lat = north - ((y + 0.5) / height) * latSpan;
    const cosLat = Math.cos((lat * Math.PI) / 180);

    for (let x = 0; x < width; x += 1) {
      const cellIndex = (y * width) + x;
      const lng = west + ((x + 0.5) / width) * lngSpan;
      if (maskPolygons.length > 0 && !pointInPreparedMask(lng, lat, maskPolygons)) {
        data[cellIndex] = FWI_NO_DATA_VALUE;
        continue;
      }

      let weightedValue = 0;
      let totalWeight = 0;
      for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
        const point = points[pointIndex];
        const dx = (lng - point.lng) * cosLat;
        const dy = lat - point.lat;
        const weight = Math.exp(-((dx * dx) + (dy * dy)) / radiusDenominator);
        weightedValue += pointValues[pointIndex] * weight;
        totalWeight += weight;
      }

      const interpolatedValue = totalWeight > 0 ? weightedValue / totalWeight : FWI_NO_DATA_VALUE;
      data[cellIndex] = interpolatedValue === FWI_NO_DATA_VALUE
        ? FWI_NO_DATA_VALUE
        : cellValueTransform?.(interpolatedValue, lat, lng) ?? interpolatedValue;
    }
  }

  return { data, width, height, west, east, south, north };
}
