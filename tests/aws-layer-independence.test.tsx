import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MapLayer } from '../types';

const { scrape, scrapeRs, adjustments } = vi.hoisted(() => ({ scrape: vi.fn(), scrapeRs: vi.fn(), adjustments: vi.fn() }));
vi.mock('../AWSFBiHData', () => ({ scrape, allFhmzStations: [] }));
vi.mock('../AWSRsData', () => ({ scrapeRs, rsAwsDummyData: { stations: [] } }));
vi.mock('../services/awsStationService', async (original) => ({ ...await original<typeof import('../services/awsStationService')>(), fetchAwsStationAdjustments: adjustments }));
import { MapboxOperationalLayers } from '../components/Map/MapboxOperationalLayers';

it('toggles AWS categories without reloading data or replacing other categories', async () => {
  scrape.mockResolvedValue({ all: [
    { type: 'precipitation', city: 'Rain', lat: 44, lon: 18, tempC: 12 },
    { type: 'agro', station: 'Agro', lat: 44, lon: 18, tempC: 13 },
    { type: 'meteo', station: 'Meteo', lat: 44, lon: 18, tempC: 14 },
    { type: 'unclassified', station: 'Raw', lat: 44, lon: 18, sensorValues: {} },
  ] });
  scrapeRs.mockResolvedValue({ stations: [{ type: 'meteo', name: 'RS', lat: 44, lon: 19, tempC: 15 }] });
  adjustments.mockResolvedValue([]);
  const markers: Array<{ name: string; remove: ReturnType<typeof vi.fn> }> = [];
  const createMarker = vi.fn((element: HTMLElement) => {
    const marker = { name: element.title, setLngLat: vi.fn(() => marker), addTo: vi.fn(() => marker), remove: vi.fn() };
    markers.push(marker);
    return marker;
  });
  const map = { style: {}, getLayer: vi.fn(), getSource: vi.fn(), on: vi.fn(), off: vi.fn() };
  const props = {
    map, activeLayers: new Set([MapLayer.AWS_METEO, MapLayer.AWS_AGRO]),
    canViewAws: true, canViewFbih: true, canViewRs: true, canViewFwi: false, canViewFireMonitoring: false, canViewMapLayers: false,
    useCyrillicStationNames: false, canAdjustAws: false, createMarker, createPopup: vi.fn(),
    geoEditorMode: 'view', geoEditorShowDraft: false, geoEditorFeatures: [], geoEditorDrawing: [],
    onGeoEditorDrawingChange: vi.fn(), onGeoEditorFeaturesChange: vi.fn(),
  } as unknown as React.ComponentProps<typeof MapboxOperationalLayers>;
  const view = render(<MapboxOperationalLayers {...props} />);
  await waitFor(() => expect(createMarker).toHaveBeenCalledTimes(3));
  const originals = [...markers];
  view.rerender(<MapboxOperationalLayers {...props} activeLayers={new Set([MapLayer.AWS_METEO, MapLayer.AWS_AGRO, MapLayer.AWS_PRECIPITATION])} />);
  expect(createMarker).toHaveBeenCalledTimes(4);
  originals.forEach(marker => expect(marker.remove).not.toHaveBeenCalled());
  expect(scrape).toHaveBeenCalledTimes(1);
  expect(scrapeRs).toHaveBeenCalledTimes(1);
  view.rerender(<MapboxOperationalLayers {...props} activeLayers={new Set([MapLayer.AWS_METEO, MapLayer.AWS_AGRO, MapLayer.AWS_PRECIPITATION, MapLayer.PROTECTED_AREAS])} />);
  expect(createMarker).toHaveBeenCalledTimes(4);
  view.rerender(<MapboxOperationalLayers {...props} />);
  expect(markers.find(m => m.name === 'Rain')!.remove).toHaveBeenCalledTimes(1);
  originals.forEach(marker => expect(marker.remove).not.toHaveBeenCalled());
  view.rerender(<MapboxOperationalLayers {...props} activeLayers={new Set()} />);
  view.rerender(<MapboxOperationalLayers {...props} />);
  expect(scrape).toHaveBeenCalledTimes(1);
  await act(async () => window.dispatchEvent(new Event('nffis:aws-dataset-updated')));
  await waitFor(() => expect(scrape).toHaveBeenCalledTimes(2));
  view.unmount();
  markers.forEach(marker => expect(marker.remove).toHaveBeenCalledTimes(1));
});
