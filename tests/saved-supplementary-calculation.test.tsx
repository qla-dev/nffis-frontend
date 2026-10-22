import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
const { availability, grid, api } = vi.hoisted(() => ({ availability: vi.fn(), grid: vi.fn(), api: vi.fn() }));
vi.mock('../services/fireMonitoringService', () => ({ fetchDailyIndexAvailability: availability, fetchFireIntelligenceGrid: grid }));
vi.mock('../services/api', () => ({ apiRequest: api }));
import { SavedSupplementaryCalculation } from '../components/Map/SavedSupplementaryCalculation';
const props = { date: '2026-10-21', location: { name: 'Sample', lat: 44, lng: 18 }, national: false };
describe('saved supplementary calculation references', () => {
  it('loads the selected index and date and shows exact inputs at the saved grid point', async () => {
    availability.mockResolvedValue({ data: [{ id: 52, valid_at: '2026-10-21T12:00:00Z', statistics: { mean: 90 } }] });
    grid.mockResolvedValue({ features: [{ geometry: { coordinates: [18, 44] }, properties: { value: 45 } }] });
    api.mockResolvedValue({ data: [{ lat: 44, lng: 18, calculation: { indexType: 'KBDI', value: 45, rainMm: 30 } }] });
    render(<SavedSupplementaryCalculation {...props} />);
    expect(availability).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Saved Angström, GFDI and KBDI maps' }));
    fireEvent.change(screen.getByLabelText('Saved supplementary index'), { target: { value: 'KBDI' } });
    expect(await screen.findByRole('table', { name: 'Saved supplementary calculation inputs' })).toHaveTextContent('30.000');
    expect(screen.getByLabelText('Saved supplementary value')).toHaveTextContent('45.000');
    expect(availability).toHaveBeenLastCalledWith('KBDI', expect.any(AbortSignal));
    expect(api).toHaveBeenCalledWith('/admin/fwi/products/52/calculations', expect.any(Object));
  });
  it('retains an older raster value and explicitly reports that exact inputs are unavailable', async () => {
    availability.mockResolvedValue({ data: [{ id: 52, valid_at: '2026-10-21T12:00:00Z' }] });
    grid.mockResolvedValue({ features: [{ geometry: { coordinates: [18, 44] }, properties: { value: 105 } }] });
    api.mockResolvedValue({ data: [], message: 'Exact inputs unavailable for this older KBDI product.' });
    render(<SavedSupplementaryCalculation {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Saved Angström, GFDI and KBDI maps' }));
    expect(await screen.findByText('Exact inputs unavailable for this older KBDI product.')).toBeInTheDocument();
    expect(screen.getByLabelText('Saved supplementary value')).toHaveTextContent('105.000');
  });
  it('does not substitute a different date when the selected product is absent', async () => {
    availability.mockResolvedValue({ data: [{ id: 52, valid_at: '2026-10-20T12:00:00Z' }] });
    render(<SavedSupplementaryCalculation {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Saved Angström, GFDI and KBDI maps' }));
    expect(await screen.findByText('No saved ANGSTROM product for 2026-10-21.')).toBeInTheDocument();
    expect(grid).not.toHaveBeenCalled();
    expect(api).not.toHaveBeenCalled();
  });
});
