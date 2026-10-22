import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MapLayer } from '../types';
const { surface, originalRaster, cogRaster, products } = vi.hoisted(() => ({ surface: vi.fn(), originalRaster: vi.fn(), cogRaster: vi.fn(), products: vi.fn() }));
vi.mock('../services/fwiCalculationService', () => ({ fetchBosnianFwiSurface: surface, sarajevoDate: () => '2026-10-09' }));
vi.mock('../lib/gis/mapboxRasterImage', () => ({ renderBosnianFwiForMapbox: originalRaster, renderFwiCogForMapbox: cogRaster }));
vi.mock('../services/fireMonitoringService', async original => ({ ...await original<typeof import('../services/fireMonitoringService')>(), fetchFireIntelligenceProducts: products }));
import { MapboxOperationalLayers } from '../components/Map/MapboxOperationalLayers';
function props(layer: MapLayer) {
  return {
    map: { style: {}, getLayer: vi.fn(), getSource: vi.fn(), addSource: vi.fn(), addLayer: vi.fn(), on: vi.fn(), off: vi.fn() },
    activeLayers: new Set([layer]), canViewFwi: true, canViewAws: false, canViewFireMonitoring: false, canViewMapLayers: false,
    geoEditorMode: 'view', geoEditorShowDraft: false, geoEditorFeatures: [], geoEditorDrawing: [],
    createMarker: vi.fn(), createPopup: vi.fn(), onGeoEditorDrawingChange: vi.fn(), onGeoEditorFeaturesChange: vi.fn(),
  } as unknown as React.ComponentProps<typeof MapboxOperationalLayers>;
}
const image = () => ({ url: 'blob:test', coordinates: [[15,45],[20,45],[20,42],[15,42]], release: vi.fn() });
describe('FWI method separation on native maps', () => {
  it.each([[MapLayer.FWI_ANGSTROM, 'ANGSTROM'], [MapLayer.FWI_GFI, 'GFDI'], [MapLayer.FWI_KBDI, 'KBDI']] as const)('renders the selected %s raster using its own scale', async (layer, type) => {
    cogRaster.mockResolvedValue(image());
    const p = props(layer);
    render(<MapboxOperationalLayers {...p} selectedFwiProductId={52} fwiDate="2026-09-20" />);
    await waitFor(() => expect(p.map.addSource).toHaveBeenCalled());
    expect(cogRaster).toHaveBeenCalledWith('/api/fire-intelligence/products/52/artifact/cog', expect.any(AbortSignal), type);
    expect(surface).not.toHaveBeenCalled();
    expect(products).not.toHaveBeenCalled();
  });

  it('renders original calculated values and does not load the Canadian COG', async () => {
    const points = [{ id: '1', lat: 44, lng: 18, fwi: 9 }];
    surface.mockResolvedValue(points); originalRaster.mockResolvedValue(image());
    const p = props(MapLayer.FWI_BOSNIAN);
    const view = render(<MapboxOperationalLayers {...p} fwiDate="2026-09-20" />);
    await waitFor(() => expect(p.map.addSource).toHaveBeenCalled());
    expect(surface).toHaveBeenCalledWith('2026-09-20');
    expect(originalRaster).toHaveBeenCalledWith(points, undefined);
    expect(cogRaster).not.toHaveBeenCalled();
    expect(products).not.toHaveBeenCalled();
    view.unmount();
  });
  it('renders only the selected Canadian COG without calling the original calculation', async () => {
    cogRaster.mockResolvedValue(image());
    const p = props(MapLayer.FIRE_INTELLIGENCE_FWI);
    render(<MapboxOperationalLayers {...p} selectedFwiProductId={42} fwiDate="2026-09-20" />);
    await waitFor(() => expect(p.map.addSource).toHaveBeenCalled());
    expect(cogRaster).toHaveBeenCalledWith('/api/fire-intelligence/products/42/artifact/cog', expect.any(AbortSignal));
    expect(surface).not.toHaveBeenCalled();
  });
  it('reports absent historical COGs instead of substituting a mock heatmap or latest date', async () => {
    const p = props(MapLayer.FIRE_INTELLIGENCE_FWI);
    const error = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<MapboxOperationalLayers {...p} fwiDate="2026-09-20" onFwiError={error} />);
    await waitFor(() => expect(error).toHaveBeenCalledWith('No Canadian FWI COG is saved for the selected date.'));
    expect(p.map.addSource).not.toHaveBeenCalled();
    expect(products).not.toHaveBeenCalled();
    expect(cogRaster).not.toHaveBeenCalled();
  });
});
