import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapLayer } from '../types';
import {
  classifyIndexValue,
  indexColorStops,
  indexCssGradient,
  indexTicks,
  SUPPLEMENTARY_INDICES,
  supplementaryIndexForLayer,
  timelineIndexType,
} from '../lib/fwi/supplementaryIndices';

const cogLayer = vi.hoisted(() => ({ render: vi.fn(), preload: vi.fn() }));
vi.mock('../components/Map/layers/Rasters/CogRasterLayer', () => ({
  CogRasterLayer: (props: unknown) => { cogLayer.render(props); return null; },
  preloadCogRaster: cogLayer.preload,
  supplementaryIndexCogStyle: (type: string) => ({ scale: type.toLowerCase(), min: 0, max: 1, smooth: true }),
}));

import { AngstromHeatLayer } from '../components/Layers/FWI/AngstromHeatLayer';
import { GFIHeatLayer } from '../components/Layers/FWI/GFIHeatLayer';
import { KBDIHeatLayer } from '../components/Layers/FWI/KBDIHeatLayer';
import { fetchDailyIndexAvailability } from '../services/fireMonitoringService';

describe('supplementary index classes', () => {
  it('match the backend danger classes at every boundary', () => {
    // Angström is inverted: lower values mean drier air and higher danger.
    expect([1.99, 2, 2.49, 2.5, 3.99, 4, 6].map(value => classifyIndexValue('ANGSTROM', value).key))
      .toEqual(['very_high', 'high', 'high', 'moderate', 'moderate', 'low', 'low']);
    expect([4.9, 5, 11.9, 12, 24.9, 25, 49.9, 50, 120].map(value => classifyIndexValue('GFDI', value).key))
      .toEqual(['low', 'moderate', 'moderate', 'high', 'high', 'very_high', 'very_high', 'extreme', 'extreme']);
    expect([0, 49.9, 50, 99.9, 100, 149.9, 150, 203.2].map(value => classifyIndexValue('KBDI', value).key))
      .toEqual(['low', 'low', 'moderate', 'moderate', 'high', 'high', 'extreme', 'extreme']);
  });

  it('builds ascending colour stops with danger colours at the dangerous end', () => {
    for (const type of ['ANGSTROM', 'GFDI', 'KBDI'] as const) {
      const positions = indexColorStops(type).map(stop => stop.position);
      expect(positions[0]).toBe(0);
      expect(positions.at(-1)).toBe(1);
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    }
    expect(indexColorStops('ANGSTROM')[0].color).toBe('#b91c1c');
    expect(indexColorStops('KBDI')[0].color).toBe('#22c55e');
    expect(indexCssGradient('KBDI')).toMatch(/^linear-gradient\(90deg, #22c55e 0\.0%/);
  });

  it('places legend ticks on the class boundaries of the display range', () => {
    expect(indexTicks('KBDI').map(tick => tick.value)).toEqual([0, 50, 100, 150, 203.2]);
    expect(indexTicks('ANGSTROM').map(tick => tick.value)).toEqual([0, 2, 2.5, 4, 6]);
    expect(indexTicks('GFDI').find(tick => tick.value === 30)).toBeUndefined();
    expect(indexTicks('GFDI').find(tick => tick.value === 12)?.position).toBeCloseTo(0.2);
  });
});

describe('timeline index selection', () => {
  it('maps layers to index types and lets FWI drive the shared timeline first', () => {
    expect(supplementaryIndexForLayer(MapLayer.FWI_GFI)?.type).toBe('GFDI');
    expect(supplementaryIndexForLayer(MapLayer.SATELLITE)).toBeNull();
    expect(timelineIndexType(new Set([MapLayer.FWI_KBDI]))).toBe('KBDI');
    expect(timelineIndexType(new Set([MapLayer.FWI_ANGSTROM]))).toBe('ANGSTROM');
    expect(timelineIndexType(new Set([MapLayer.FIRE_INTELLIGENCE_FWI, MapLayer.FWI_KBDI]))).toBe('FWI');
    expect(timelineIndexType(new Set([MapLayer.SATELLITE]))).toBeNull();
  });
});

describe('server index raster layers', () => {
  beforeEach(() => { cogLayer.render.mockClear(); cogLayer.preload.mockClear(); });

  it('render the selected daily product COG with the index colour scale', () => {
    render(<KBDIHeatLayer visible pane="fwi" productId={41} prefetchProductId={42} />);
    expect(cogLayer.render).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/fire-intelligence/products/41/artifact/cog', pane: 'fwi', style: expect.objectContaining({ scale: 'kbdi' }),
    }));
    expect(cogLayer.preload).toHaveBeenCalledWith('/api/fire-intelligence/products/42/artifact/cog');

    render(<AngstromHeatLayer visible pane="fwi" productId={7} />);
    expect(cogLayer.render).toHaveBeenLastCalledWith(expect.objectContaining({ style: expect.objectContaining({ scale: 'angstrom' }) }));
  });

  it('render nothing while hidden or before a product exists for the date', () => {
    render(<GFIHeatLayer visible={false} pane="fwi" productId={3} prefetchProductId={4} />);
    render(<GFIHeatLayer visible pane="fwi" productId={null} />);
    expect(cogLayer.render).not.toHaveBeenCalled();
    expect(cogLayer.preload).not.toHaveBeenCalled();
  });
});

describe('daily index availability API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('requests the per-index availability endpoint without caching', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [], meta: { index_type: 'GFDI' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchDailyIndexAvailability('GFDI');
    expect(result.meta.index_type).toBe('GFDI');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/fire-intelligence\/availability\/GFDI$/);
    expect(init).toEqual(expect.objectContaining({ cache: 'no-store' }));
  });

  it('keeps method labels for each index', () => {
    expect(Object.values(SUPPLEMENTARY_INDICES).map(index => index.method)).toEqual([
      'Chandler et al. 1983 · 13:00', 'McArthur Mk3 · Noble et al. 1980', 'Keetch & Byram 1968 · mm',
    ]);
  });
});
