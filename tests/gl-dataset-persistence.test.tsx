import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Language, MapLayer } from '../types';
import type { DatasetLayer } from '../services/datasetService';
const { fetchFeatures, availability } = vi.hoisted(() => ({ fetchFeatures: vi.fn(), availability: vi.fn() }));
vi.mock('../services/fireMonitoringService', async original => ({ ...await original<typeof import('../services/fireMonitoringService')>(), fetchFwiAvailability: availability }));
vi.mock('../services/datasetService', async original => ({ ...await original<typeof import('../services/datasetService')>(), fetchDatasetLayerFeatures: fetchFeatures }));
vi.mock('../components/Map/MapControls', () => ({ MapControls: () => null }));
vi.mock('../components/Map/GLMapScaleControl', () => ({ GLMapScaleControl: () => null }));
vi.mock('../components/Map/MapboxOperationalLayers', () => ({ MapboxOperationalLayers: (props: { selectedFwiProductId?: number }) => <output data-testid="map-product">{props.selectedFwiProductId ?? 'none'}</output> }));
import { GLGISMapCore } from '../components/Map/GLGISMapCore';

function harness(delivery: 'vector_tile' | 'geojson') {
  const handlers = new Map<string, Set<() => void>>();
  const sources = new Map<string, any>();
  const layers = new Map<string, any>();
  let west = 15;
  const map = {
    addControl: vi.fn(), getCanvas: () => document.createElement('canvas'),
    on: (event: string, callback: () => void) => { if (!handlers.has(event)) handlers.set(event, new Set()); handlers.get(event)!.add(callback); },
    off: (event: string, callback: () => void) => handlers.get(event)?.delete(callback),
    addSource: vi.fn((id: string, definition: any) => { if (sources.has(id)) throw new Error('Duplicate source'); sources.set(id, { ...definition, setData: vi.fn() }); }),
    removeSource: vi.fn((id: string) => sources.delete(id)), getSource: (id: string) => sources.get(id),
    addLayer: vi.fn((layer: any) => { if (layers.has(layer.id)) throw new Error('Duplicate layer'); layers.set(layer.id, layer); }),
    removeLayer: vi.fn((id: string) => layers.delete(id)), getLayer: (id: string) => layers.get(id),
    getStyle: () => ({ sources: Object.fromEntries(sources), layers: [...layers.values()] }),
    getBounds: () => ({ getWest: () => west, getSouth: () => 42, getEast: () => 20, getNorth: () => 46 }),
    getZoom: () => 8, areTilesLoaded: () => true, remove: vi.fn(),
  };
  const layer = { id: 7, layer_kind: 'vector', data_delivery: delivery, tile_version: '1', geometry_family: 'polygon', style: { color: '#f00' }, filter_fields: [], display_name: 'Borders' } as DatasetLayer;
  const props = {
    engine: { createMap: () => map, createNavigationControl: vi.fn() }, renderer: 'maplibre',
    activeLayers: new Set(), datasetLayers: [layer], activeDatasetLayerIds: new Set([7]), datasetLayerFilters: {}, datasetLayerRefreshKey: 0,
    language: Language.EN, incidents: [], geoEditorMode: 'view', geoEditorLayerId: null,
    onDatasetFeaturesLoaded: vi.fn(), onDatasetLayerLoadingChange: vi.fn(),
  } as unknown as React.ComponentProps<typeof GLGISMapCore>;
  return { map, props, sources, emit: (event: string) => handlers.get(event)?.forEach(callback => callback()), pan: () => { west += .01; handlers.get('moveend')?.forEach(callback => callback()); } };
}

afterEach(() => vi.useRealTimers());
describe('GL dataset persistence', () => {
  it('retains border vector tiles across small pans, zoom events and unrelated layer toggles', async () => {
    vi.useFakeTimers();
    const h = harness('vector_tile');
    const view = render(<GLGISMapCore {...h.props} />);
    await act(async () => h.emit('load'));
    const source = h.sources.get('poc-dataset-7-source');
    expect(source.type).toBe('vector');
    await act(async () => { h.pan(); await vi.advanceTimersByTimeAsync(150); });
    expect(h.sources.get('poc-dataset-7-source')).toBe(source);
    view.rerender(<GLGISMapCore {...h.props} activeLayers={new Set([MapLayer.AWS_PRECIPITATION])} datasetLayers={[...h.props.datasetLayers]} />);
    expect(h.sources.get('poc-dataset-7-source')).toBe(source);
    expect(h.map.removeSource).not.toHaveBeenCalledWith('poc-dataset-7-source');
    expect(h.map.addSource.mock.calls.filter(([id]) => id === 'poc-dataset-7-source')).toHaveLength(1);
    view.rerender(<GLGISMapCore {...h.props} activeDatasetLayerIds={new Set()} />);
    expect(h.sources.has('poc-dataset-7-source')).toBe(false);
    view.unmount();
  });

  it('keeps old GeoJSON borders visible during viewport requests and updates the existing source', async () => {
    vi.useFakeTimers();
    const collection = { type: 'FeatureCollection', features: [] };
    fetchFeatures.mockResolvedValue(collection);
    const h = harness('geojson');
    const view = render(<GLGISMapCore {...h.props} />);
    await act(async () => h.emit('load'));
    const source = h.sources.get('poc-dataset-7-source');
    expect(source.type).toBe('geojson');
    let resolve!: (value: unknown) => void;
    fetchFeatures.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    await act(async () => { h.pan(); await vi.advanceTimersByTimeAsync(150); });
    expect(h.sources.get('poc-dataset-7-source')).toBe(source);
    expect(h.map.removeSource).not.toHaveBeenCalledWith('poc-dataset-7-source');
    await act(async () => resolve(collection));
    expect(source.setData).toHaveBeenCalledWith(collection);
    view.rerender(<GLGISMapCore {...h.props} datasetLayers={[...h.props.datasetLayers]} />);
    expect(fetchFeatures).toHaveBeenCalledTimes(2);
    view.unmount();
  });
});


describe('Canadian FWI map date synchronization', () => {
  it('updates the map on range changes and retains the animated date when paused', async () => {
    vi.useFakeTimers();
    const dates = ['2026-09-01', '2026-09-02', '2026-09-03'];
    availability.mockResolvedValue({ data: dates.map((date, i) => ({ id: i + 1, valid_at: `${date}T12:00:00Z` })) });
    const h = harness('vector_tile');
    function Map() {
      const [date, setDate] = useState('2026-09-03');
      return <><button onClick={() => setDate('2026-09-01')}>External date</button><button onClick={() => setDate('2026-09-04')}>Missing date</button><output data-testid="shared-date">{date}</output><GLGISMapCore {...h.props}
        activeLayers={new Set([MapLayer.FIRE_INTELLIGENCE_FWI])} canViewFwi
        fwiDate={date} onFwiDateChange={setDate} /></>;
    }
    render(<Map />);
    await act(async () => h.emit('load'));
    expect(screen.getByTestId('map-product')).toHaveTextContent('3');
    fireEvent.change(screen.getByLabelText('FWI to date'), { target: { value: '2026-09-02' } });
    expect(screen.getByLabelText('Date shown on map')).toHaveValue('2026-09-02');
    expect(screen.getByTestId('shared-date')).toHaveTextContent('2026-09-02');
    expect(screen.getByTestId('map-product')).toHaveTextContent('2');
    fireEvent.click(screen.getByRole('button', { name: 'Play FWI animation' }));
    expect(screen.getByTestId('map-product')).toHaveTextContent('1');
    await act(async () => vi.advanceTimersByTimeAsync(1400));
    expect(screen.getByTestId('map-product')).toHaveTextContent('2');
    expect(screen.getByTestId('shared-date')).toHaveTextContent('2026-09-02');
    fireEvent.click(screen.getByRole('button', { name: 'Pause FWI animation' }));
    await act(async () => vi.advanceTimersByTimeAsync(2800));
    expect(screen.getByLabelText('Date shown on map')).toHaveValue('2026-09-02');
    expect(screen.getByTestId('map-product')).toHaveTextContent('2');
    fireEvent.change(screen.getByLabelText('FWI from date'), { target: { value: '2026-09-10' } });
    expect(screen.getByTestId('map-product')).toHaveTextContent('none');
    expect(screen.getByText('No saved FWI for these dates. Change the range above.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'External date' }));
    expect(screen.getByLabelText('Date shown on map')).toHaveValue('2026-09-01');
    expect(screen.getByTestId('map-product')).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'Missing date' }));
    expect(screen.getByTestId('map-product')).toHaveTextContent('none');
    expect(screen.queryByLabelText('Date shown on map')).not.toBeInTheDocument();
  });
});
