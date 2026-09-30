import { describe, expect, it } from 'vitest';
import { MapLayer } from '../types';
import {
  EXTERNAL_BASE_LAYERS,
  NASA_FIRMS_LAYER,
  NASA_LAND_SURFACE_TEMPERATURE_LAYER,
  OPENSTREETMAP_BASE_LAYER,
  gibsObservationDate,
  usesPlainBaseLayer,
} from '../lib/gis/externalMapLayers';

describe('external map layers', () => {
  it('uses a key-free OpenStreetMap fallback instead of unkeyed CARTO tiles', () => {
    expect(OPENSTREETMAP_BASE_LAYER.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(OPENSTREETMAP_BASE_LAYER.attribution).toContain('openstreetmap.org/copyright');
    expect(OPENSTREETMAP_BASE_LAYER.className).toBe('nffis-positron-basemap');
    expect(JSON.stringify(EXTERNAL_BASE_LAYERS)).not.toContain('cartocdn.com');
  });

  it('uses a sourced basemap for both the default vector view and Windy', () => {
    expect(usesPlainBaseLayer(undefined)).toBe(false);
    expect(usesPlainBaseLayer(MapLayer.WINDY)).toBe(false);
    expect(usesPlainBaseLayer(MapLayer.SATELLITE)).toBe(false);
    expect(usesPlainBaseLayer(MapLayer.NASA_FIRMS)).toBe(false);
  });

  it('uses the cached Sentinel-2 cloudless tile template', () => {
    const sentinel = EXTERNAL_BASE_LAYERS[MapLayer.SENTINEL];

    expect(sentinel?.url).toContain('/{z}/{x}/{y}.jpg');
    expect(sentinel?.maxNativeZoom).toBe(14);
  });

  it('loads Sentinel tiles through the same-origin backend cache', () => {
    const sentinel = EXTERNAL_BASE_LAYERS[MapLayer.SENTINEL];

    expect(sentinel?.url).toBe('/api/copernicus-tiles/{z}/{x}/{y}.jpg');
  });

  it('uses genuine NASA products for fires and land-surface temperature', () => {
    expect(NASA_FIRMS_LAYER).toBe('MODIS_Combined_Thermal_Anomalies_All');
    expect(NASA_LAND_SURFACE_TEMPERATURE_LAYER).toBe('MODIS_Terra_Land_Surface_Temp_Day');
  });

  it('requests the previous UTC day to account for near-real-time ingestion lag', () => {
    expect(gibsObservationDate(new Date('2026-09-04T00:30:00Z'))).toBe('2026-09-03');
    expect(gibsObservationDate(new Date('2026-01-01T12:00:00Z'))).toBe('2025-12-31');
  });
});
