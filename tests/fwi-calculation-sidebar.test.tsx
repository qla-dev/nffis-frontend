import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const { fetchWeather, fetchAvailability, apiRequest } = vi.hoisted(() => ({ fetchWeather: vi.fn(), fetchAvailability: vi.fn(), apiRequest: vi.fn() }));
vi.mock('../services/fwiCalculationService', async original => ({ ...await original<typeof import('../services/fwiCalculationService')>(), fetchFwiWeather: fetchWeather }));
vi.mock('../services/fireMonitoringService', async original => ({ ...await original<typeof import('../services/fireMonitoringService')>(), fetchFwiAvailability: fetchAvailability }));
vi.mock('../services/api', async original => ({ ...await original<typeof import('../services/api')>(), apiRequest }));
import { sarajevoDate } from '../services/fwiCalculationService';
import { FwiCalculationSidebar } from '../components/Map/FwiCalculationSidebar';
const props = { isSuperAdmin: true, date: '2026-10-09', location: { name: 'Tuzla', lat: 44.53, lng: 18.67 }, onDateChange: vi.fn(), onPickLocation: vi.fn(), onClose: vi.fn() };
function weatherResponse(date: string) {
  return { date, source: 'Test weather', historical: true, data: [{ hourly: { time: [`${date}T12:00`], temperature_2m: [25], relative_humidity_2m: [40], wind_speed_10m: [15], precipitation: [0] }, daily: { time: [date], precipitation_sum: [0] } }] };
}
afterEach(() => vi.useRealTimers());

describe('superadmin calculation sidebar', () => {
  it('does not report cancelled StrictMode archive requests as unavailable', async () => {
    fetchAvailability.mockImplementation((signal: AbortSignal) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')));
      queueMicrotask(() => { if (!signal.aborted) resolve({ data: [] }); });
    }));
    fetchWeather.mockImplementation(async (_, date) => weatherResponse(date));
    render(<React.StrictMode><FwiCalculationSidebar {...props} /></React.StrictMode>);
    await screen.findAllByText('ISI estimate');
    await waitFor(() => expect(screen.getByText('No Canadian COG is saved for 2026-10-09.')).toBeInTheDocument());
    expect(screen.queryByText('Canadian archive is unavailable.')).not.toBeInTheDocument();
    expect(screen.getByText('Canadian point recalculation · Tuzla')).toBeInTheDocument();
  });
  it('places the formula comparison in its own tab and shows Canadian calculation details', async () => {
    fetchAvailability.mockResolvedValue({ data: [] });
    fetchWeather.mockImplementation(async (_, date) => weatherResponse(date));
    render(<FwiCalculationSidebar {...props} />);
    await screen.findAllByText('ISI estimate');
    const calculations = screen.getByRole('tabpanel', { name: 'Calculations' });
    expect(within(calculations).getByText('Canadian inputs and intermediate values')).toBeVisible();
    expect(within(calculations).getByText('Updated FFMC')).toBeVisible();
    expect(within(calculations).getByText('Wind function fW')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'FWI parameter comparison' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Formula comparison' }));
    expect(screen.getByRole('tab', { name: 'Formula comparison' })).toHaveAttribute('aria-selected', 'true');
    const comparison = screen.getByRole('tabpanel', { name: 'Formula comparison' });
    const table = within(comparison).getByRole('table', { name: 'Bosnian and Canadian FWI comparison' });
    expect(within(table).getByRole('columnheader', { name: 'Bosnian' })).toBeVisible();
    expect(within(table).getByRole('columnheader', { name: 'Canadian' })).toBeVisible();
    expect(screen.queryByRole('tabpanel', { name: 'Calculations' })).not.toBeInTheDocument();
  });
  it('calculates today at the current weather hour and refreshes without needing a saved raster', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const date = sarajevoDate();
    const times = Array.from({ length: 48 }, (_, index) => new Date(Date.parse(`${date}T10:00:00Z`) + (index - 47) * 3600000).toISOString().slice(0, 16));
    fetchAvailability.mockResolvedValue({ data: [] });
    fetchWeather.mockResolvedValue({ ...weatherResponse(date), historical: false, data: [{
      current: { time: `${date}T10:15` },
      hourly: { time: times, temperature_2m: times.map(() => 25), relative_humidity_2m: times.map(() => 40), wind_speed_10m: times.map(() => 15), precipitation: times.map(() => 0) },
      daily: { time: [date], precipitation_sum: [0] },
    }] });
    render(<FwiCalculationSidebar {...props} date={date} />);
    await screen.findAllByText('ISI estimate');
    const calculations = screen.getByRole('tabpanel', { name: 'Calculations' });
    expect(within(calculations).getByText('Canadian FWI - current weather')).toBeVisible();
    expect(within(calculations).getByRole('cell', { name: `${date}T10:15` })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh weather' }));
    await waitFor(() => expect(fetchWeather).toHaveBeenLastCalledWith([props.location], date, true, true));
    await screen.findAllByText('ISI estimate');
    const previousCount = fetchWeather.mock.calls.length;
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    await waitFor(() => expect(fetchWeather.mock.calls.length).toBe(previousCount + 1));
  });
  it('does not render or request details for other users', () => {
    render(<FwiCalculationSidebar {...props} isSuperAdmin={false} />);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(fetchWeather).not.toHaveBeenCalled();
    expect(fetchAvailability).not.toHaveBeenCalled();
  });
  it('shows point inputs, calculation steps and changes historical dates', async () => {
    fetchAvailability.mockResolvedValue({ data: [] });
    fetchWeather.mockImplementation(async (_, date) => weatherResponse(date));
    const view = render(<FwiCalculationSidebar {...props} />);
    await screen.findAllByText('ISI estimate');
    expect(screen.getAllByText(/Temperature/).length).toBeGreaterThan(0);
    expect(screen.getByText('Daily precipitation and dry-day count')).toBeInTheDocument();
    expect(screen.getByText('No Canadian COG is saved for 2026-10-09.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('FWI calculation date'), { target: { value: '2026-09-20' } });
    expect(props.onDateChange).toHaveBeenCalledWith('2026-09-20');
    view.rerender(<FwiCalculationSidebar {...props} date="2026-09-20" />);
    await waitFor(() => expect(fetchWeather).toHaveBeenLastCalledWith([props.location], '2026-09-20', true));
    await screen.findAllByText('ISI estimate');
    fireEvent.click(screen.getByText('Select location on map'));
    expect(props.onPickLocation).toHaveBeenCalled();
  });
  it('supports the national sample mean and each contributing location', async () => {
    fetchAvailability.mockResolvedValue({ data: [] });
    fetchWeather.mockImplementation(async (locations, date) => ({ ...weatherResponse(date), data: locations.map(() => weatherResponse(date).data[0]) }));
    render(<FwiCalculationSidebar {...props} location={null} />);
    fireEvent.click(screen.getByText('National overview'));
    await screen.findByLabelText('FWI sample location');
    expect(screen.getByText(/arithmetic mean/)).toBeInTheDocument();
    expect(fetchWeather.mock.calls[0][0].length).toBeGreaterThan(1);
  });
});
