import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Language } from '../types';
import * as service from '../services/timeSeriesService';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Tooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  CircleMarker: ({ children }: { children: React.ReactNode }) => <div data-testid="hotspot">{children}</div>,
}));
vi.mock('../components/Map/layers/Rasters/CogRasterLayer', () => ({
  CogRasterLayer: ({ url }: { url: string }) => <div data-testid="raster">{url}</div>,
  FWI_COG_STYLE: { scale: 'fwi', min: 0, max: 80 },
  supplementaryIndexCogStyle: () => ({ scale: 'kbdi', min: 0, max: 200 }),
}));

const { HistoryViewer } = await import('../components/Pdr/HistoryViewer');

const catalogue = {
  data: [
    { key: 'fwi', label: { en: 'Fire Weather Index (FWI)', bs: 'FWI' }, type: 'raster' as const, group: 'fire_danger' as const, scale: 'fwi', dates: [{ date: '2026-10-18', product_id: 7, mean: 8.6 }, { date: '2026-10-19', product_id: 9, mean: 10.2 }] },
    { key: 'vegetation-dryness', label: { en: 'Vegetation dryness (VDM)', bs: 'VDM' }, type: 'raster' as const, group: 'vegetation' as const, scale: 'dryness', min: 0, max: 0.3, dates: [] },
    { key: 'hotspots', label: { en: 'Satellite hotspot detections', bs: 'Detekcije' }, type: 'points' as const, group: 'detections' as const, dates: [{ date: '2026-10-17', count: 2 }] },
  ],
  meta: { date_from: '2025-10-20', date_to: '2026-10-19', timezone: 'Europe/Sarajevo' },
};

describe('HistoryViewer', () => {
  it('shows the latest raster of the first layer and steps back in time', async () => {
    vi.spyOn(service, 'fetchTimeSeriesCatalogue').mockResolvedValue(catalogue);
    render(<HistoryViewer language={Language.EN} isDarkMode={false} />);

    expect(await screen.findByTestId('raster')).toHaveTextContent('/api/fire-intelligence/products/9/artifact/cog');
    expect(screen.getByTestId('history-summary')).toHaveTextContent('BiH mean: 10.2');
    expect(screen.getByRole('button', { name: /Vegetation dryness/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('raster')).toHaveTextContent('/api/fire-intelligence/products/7/artifact/cog');
  });

  it('loads hotspot detections for the selected date', async () => {
    vi.spyOn(service, 'fetchTimeSeriesCatalogue').mockResolvedValue(catalogue);
    const hotspots = vi.spyOn(service, 'fetchHotspotsForDate').mockResolvedValue({
      type: 'FeatureCollection',
      features: [1, 2].map(id => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [18.4, 43.8] }, properties: { id, source: 'modis', sensor: 'MOD14', detected_at: '2026-10-17T10:00:00Z', frp: 20, confidence: 80, jurisdiction: 'fbih' } })),
    });
    render(<HistoryViewer language={Language.EN} isDarkMode={false} />);

    await userEvent.click(await screen.findByRole('button', { name: /Satellite hotspot detections/ }));

    await waitFor(() => expect(screen.getAllByTestId('hotspot')).toHaveLength(2));
    expect(hotspots).toHaveBeenCalledWith('2026-10-17', expect.anything());
    expect(screen.getByTestId('history-summary')).toHaveTextContent('2 detections');
  });
});
