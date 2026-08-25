import { describe, expect, it, vi } from 'vitest';
import {
  fetchDatasetLayerFeatures,
  fetchDatasetLayerFields,
  fetchDatasetLayerFieldValues,
  fetchDatasetLayerFilterOptions,
  fetchDatasetLayers,
  saveDatasetLayerStyle,
  updateDatasetFeatureAttributes,
  bulkSaveDatasetFeatureGeometries,
  createDatasetPolygon,
} from '../services/datasetService';

describe('dataset/GIS service', () => {
  it('loads layer catalog, fields, filter options, and field values', async () => {
    const layer = { id: 4, display_name: 'Cantons' };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ layers: [layer] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ fields: [{ name: 'name', kind: 'text' }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ fields: [{ name: 'name', kind: 'values' }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ values: [{ value: 'Sarajevo', count: 3 }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchDatasetLayers()).resolves.toEqual([layer]);
    await expect(fetchDatasetLayerFields(4)).resolves.toEqual([{ name: 'name', kind: 'text' }]);
    await expect(fetchDatasetLayerFilterOptions(4)).resolves.toEqual([{ name: 'name', kind: 'values' }]);
    await expect(fetchDatasetLayerFieldValues(4, 'name', 20)).resolves.toEqual([{ value: 'Sarajevo', count: 3 }]);
    expect(fetchMock.mock.calls[3][0]).toBe('/api/dataset-layers/4/field-values?field=name&limit=20');
  });

  it('serializes bounding box, search, value, and numeric feature filters', async () => {
    const geojson = { type: 'FeatureCollection', features: [] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ geojson }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchDatasetLayerFeatures(8, {
      bbox: '15,42,20,46', limit: 100, tolerance: 0.4,
      filters: {
        q: '  forest  ', values: { category: ['A', '', 'B'] },
        min: { area: '10', ignored: '' }, max: { area: '99' },
      },
    })).resolves.toEqual(geojson);

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('/api/dataset-layers/8/features?');
    expect(decodeURIComponent(url)).toContain('bbox=15,42,20,46');
    expect(decodeURIComponent(url)).toContain('filter[category]=A,B');
    expect(decodeURIComponent(url)).toContain('min[area]=10');
    expect(decodeURIComponent(url)).toContain('max[area]=99');
    expect(decodeURIComponent(url)).toContain('q=forest');
  });

  it('passes an abort signal to a layer feature request', async () => {
    const controller = new AbortController();
    const geojson = { type: 'FeatureCollection', features: [] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ geojson }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchDatasetLayerFeatures(9, { signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/dataset-layers/9/features',
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('updates feature attributes and layer styles', async () => {
    const feature = { type: 'Feature', id: 'a/b', properties: { status: 'active' }, geometry: null };
    const layer = { id: 2, style: { color: '#f00' } };
    const fetchMock = vi.fn()
      .mockImplementationOnce(async () => {
        document.cookie = 'XSRF-TOKEN=dataset-csrf; path=/';
        return new Response(null, { status: 204 });
      })
      .mockResolvedValueOnce(new Response(JSON.stringify({ feature }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ layer }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateDatasetFeatureAttributes(2, 'a/b', { status: 'active' })).resolves.toEqual(feature);
    await expect(saveDatasetLayerStyle(2, { color: '#f00' })).resolves.toEqual(layer);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/dataset-layers/2/features/a%2Fb', expect.objectContaining({
      method: 'PATCH', body: JSON.stringify({ attributes: { status: 'active' } }),
      headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'dataset-csrf' }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/dataset-layers/2/style', expect.objectContaining({
      method: 'PATCH', body: JSON.stringify({ style: { color: '#f00' } }),
      headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'dataset-csrf' }),
    }));
  });

  it('rejects non-successful dataset responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })));
    await expect(fetchDatasetLayers()).rejects.toThrow('API request failed with 403');
  });

  it('creates polygons and bulk-saves edited PostGIS geometries', async () => {
    const geometry: GeoJSON.Polygon = { type: 'Polygon', coordinates: [[[18, 44], [19, 44], [19, 45], [18, 44]]] };
    const feature = { type: 'Feature', id: 91, properties: { name: 'Zone' }, geometry };
    const fetchMock = vi.fn()
      .mockImplementationOnce(async () => { document.cookie = 'XSRF-TOKEN=geo-csrf; path=/'; return new Response(null, { status: 204 }); })
      .mockResolvedValueOnce(new Response(JSON.stringify({ feature }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ updated_feature_ids: ['91'] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createDatasetPolygon(7, 'Zone', geometry)).resolves.toEqual(feature);
    await expect(bulkSaveDatasetFeatureGeometries(7, [{ id: 91, geometry }])).resolves.toEqual(['91']);
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/dataset-layers/7/features', expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Zone', geometry, attributes: {}, source_srid: 4326 }) }));
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/dataset-layers/7/features', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ changes: [{ id: 91, geometry }], source_srid: 4326 }) }));
  });
});
