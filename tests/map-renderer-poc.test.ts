import { describe, expect, it } from 'vitest';
import {
  datasetTileQuery,
  mapLibreTileUrl,
  selectMapRenderer,
  wmsTileUrl,
} from '../lib/gis/mapRendererPoc';

describe('map renderer proof-of-concept helpers', () => {
  it('keeps Leaflet as the fallback and requires the feature gate', () => {
    expect(selectMapRenderer('?mapRenderer=maplibre', { enabled: false })).toBe('leaflet');
    expect(selectMapRenderer('', { enabled: true })).toBe('leaflet');
    expect(selectMapRenderer('?mapRenderer=maplibre', { enabled: true })).toBe('maplibre');
    expect(selectMapRenderer('?mapRenderer=leaflet', { enabled: true, defaultRenderer: 'maplibre' })).toBe('leaflet');
    expect(selectMapRenderer('?mapRenderer=mapbox', { enabled: true })).toBe('leaflet');
    expect(selectMapRenderer('?mapRenderer=mapbox', { enabled: true, mapboxEnabled: true })).toBe('mapbox');
    expect(selectMapRenderer('', { enabled: true, mapboxEnabled: true, defaultRenderer: 'mapbox' })).toBe('mapbox');
  });

  it('translates Leaflet subdomain URLs and preserves dataset filters', () => {
    expect(mapLibreTileUrl('https://{s}.tile.example/{z}/{x}/{y}.png')).toContain('https://a.tile.example');
    const query = new URLSearchParams(datasetTileQuery('42', {
      q: 'road',
      values: { status: ['open', 'planned'] },
      min: { width: '3' },
      max: { width: '9' },
    }));
    expect(Object.fromEntries(query)).toEqual({
      v: '42', q: 'road', 'filter[status]': 'open,planned', 'min[width]': '3', 'max[width]': '9',
    });
  });

  it('keeps the MapLibre WMS bounding-box token unescaped', () => {
    const url = wmsTileUrl('/geoserver/wms', 'nffis:forest', { time: '2026-09-15' });
    expect(url).toContain('bbox={bbox-epsg-3857}');
    expect(url).toContain('layers=nffis%3Aforest');
    expect(url).toContain('time=2026-09-15');
  });
});
