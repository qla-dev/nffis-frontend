import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DatasetLayer } from '../services/datasetService';

const { fetchDatasetLayerFeatures, leafletState } = vi.hoisted(() => ({
  fetchDatasetLayerFeatures: vi.fn(),
  leafletState: {
    west: 15,
    zoom: 8,
    handlers: {} as Record<string, () => void>,
    map: null as unknown as {
      getBounds: () => { getWest: () => number; getSouth: () => number; getEast: () => number; getNorth: () => number };
      getZoom: () => number;
    },
  },
}));

leafletState.map = {
  getBounds: () => ({
    getWest: () => leafletState.west,
    getSouth: () => 42,
    getEast: () => 20,
    getNorth: () => 46,
  }),
  getZoom: () => leafletState.zoom,
};

vi.mock('../services/datasetService', async (importOriginal) => ({
  ...await importOriginal<typeof import('../services/datasetService')>(),
  fetchDatasetLayerFeatures,
}));

vi.mock('react-leaflet', () => ({
  useMap: () => leafletState.map,
  useMapEvents: (handlers: Record<string, () => void>) => {
    leafletState.handlers = handlers;
    return null;
  },
  GeoJSON: ({ data }: { data: GeoJSON.FeatureCollection }) => (
    <div data-testid="geojson-data">{String(data.features[0]?.id || 'empty')}</div>
  ),
}));

import { DatasetGeoJsonLayer } from '../components/Map/layers/Datasets/DatasetGeoJsonLayer';

const layer: DatasetLayer = {
  id: 7,
  table_schema: 'public',
  table_name: 'cantons',
  display_name: 'Cantons',
  jurisdiction: 'shared',
  category: 'administrative',
  geometry_family: 'polygon',
  srid: 4326,
  feature_count: 2,
  style: { renderer: 'single', color: '#2563eb' },
  filter_fields: [],
  visible_by_default: false,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

afterEach(() => {
  vi.useRealTimers();
  leafletState.west = 15;
  leafletState.zoom = 8;
  leafletState.handlers = {};
});

describe('DatasetGeoJsonLayer request lifecycle', () => {
  it('does not request a layer until its minimum zoom is reached', async () => {
    vi.useFakeTimers();
    fetchDatasetLayerFeatures.mockResolvedValue({ type: 'FeatureCollection', features: [] });
    const onLoadingChange = vi.fn();

    render(
      <DatasetGeoJsonLayer
        layer={{ ...layer, min_zoom: 15 }}
        pane="datasets"
        onLoadingChange={onLoadingChange}
      />,
    );

    await act(async () => { vi.advanceTimersByTime(200); });
    expect(fetchDatasetLayerFeatures).not.toHaveBeenCalled();
    expect(onLoadingChange).toHaveBeenLastCalledWith(7, false);

    leafletState.zoom = 15;
    act(() => leafletState.handlers.zoomend());
    await act(async () => { vi.advanceTimersByTime(140); });

    expect(fetchDatasetLayerFeatures).toHaveBeenCalledTimes(1);
  });

  it('does not request a layer outside its catalogue bounds', async () => {
    vi.useFakeTimers();

    render(
      <DatasetGeoJsonLayer
        layer={{
          ...layer,
          bounds: { minx: 10, miny: 40, maxx: 14, maxy: 41 },
        }}
        pane="datasets"
      />,
    );

    await act(async () => { vi.advanceTimersByTime(200); });
    expect(fetchDatasetLayerFeatures).not.toHaveBeenCalled();
  });

  it('keeps the loader active and ignores an older response after the viewport changes', async () => {
    vi.useFakeTimers();
    const first = deferred<GeoJSON.FeatureCollection>();
    const second = deferred<GeoJSON.FeatureCollection>();
    fetchDatasetLayerFeatures
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const onLoadingChange = vi.fn();

    render(
      <DatasetGeoJsonLayer
        layer={layer}
        pane="datasets"
        onLoadingChange={onLoadingChange}
      />,
    );

    expect(onLoadingChange).toHaveBeenLastCalledWith(7, true);
    await act(async () => { vi.advanceTimersByTime(140); });
    const firstSignal = fetchDatasetLayerFeatures.mock.calls[0][1].signal as AbortSignal;

    leafletState.west = 16;
    act(() => leafletState.handlers.moveend());
    expect(firstSignal.aborted).toBe(true);
    await act(async () => { vi.advanceTimersByTime(140); });

    await act(async () => {
      second.resolve({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', id: 'new-response', properties: {}, geometry: null }],
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId('geojson-data')).toHaveTextContent('new-response');
    expect(onLoadingChange).toHaveBeenLastCalledWith(7, false);

    await act(async () => {
      first.resolve({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', id: 'stale-response', properties: {}, geometry: null }],
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId('geojson-data')).toHaveTextContent('new-response');
  });
});
