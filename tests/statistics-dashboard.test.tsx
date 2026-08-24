import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Language } from '../types';

const { fetchReportStatistics } = vi.hoisted(() => ({ fetchReportStatistics: vi.fn() }));
vi.mock('../services/reportStatisticsService', () => ({ fetchReportStatistics }));

import StatisticsDashboard from '../components/Statistics/StatisticsDashboard';

const statistics = {
  total: 9,
  by_incident_type: [{ label: 'Fire', count: 6 }, { label: 'Flood', count: 3 }],
  daily: [{ date: '2026-08-23', count: 4 }, { date: '2026-08-24', count: 5 }],
  by_weather_condition: [{ label: 'Clear Sky', count: 5 }, { label: 'Rain', count: 4 }],
};

describe('StatisticsDashboard', () => {
  beforeEach(() => fetchReportStatistics.mockResolvedValue(statistics));

  it('renders KPIs, trend, type, and weather distributions', async () => {
    render(<StatisticsDashboard language={Language.EN} isDarkMode />);
    expect(screen.getByLabelText('Loading statistics')).toBeInTheDocument();
    expect(await screen.findByText('Total incidents')).toBeInTheDocument();
    expect(screen.getByText('Fire incidents')).toBeInTheDocument();
    expect(screen.getByText('Flood incidents')).toBeInTheDocument();
    expect(screen.getByText('Active days')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Incident reports by day' })).toBeInTheDocument();
    expect(screen.getByText('Clear Sky')).toBeInTheDocument();
    expect(screen.getAllByText('9').length).toBeGreaterThan(0);
  });

  it('renders the two live-test incidents as one fire and one flood', async () => {
    fetchReportStatistics.mockResolvedValue({
      total: 2,
      by_incident_type: [{ label: 'FIRE', count: 1 }, { label: 'FLOOD', count: 1 }],
      daily: [{ date: '2026-08-24', count: 2 }],
      by_weather_condition: [{ label: 'Clear Sky', count: 1 }, { label: 'Heavy Rain', count: 1 }],
    });

    render(<StatisticsDashboard language={Language.EN} isDarkMode={false} />);

    const totalCard = (await screen.findByText('Total incidents')).parentElement;
    const fireCard = screen.getByText('Fire incidents').parentElement;
    const floodCard = screen.getByText('Flood incidents').parentElement;
    const activeDaysCard = screen.getByText('Active days').parentElement;

    expect(totalCard).toHaveTextContent('2Total incidents');
    expect(fireCard).toHaveTextContent('1Fire incidents');
    expect(floodCard).toHaveTextContent('1Flood incidents');
    expect(activeDaysCard).toHaveTextContent('1Active days');
    expect(screen.getByText('FIRE').parentElement).toHaveTextContent('1 (50%)');
    expect(screen.getByText('FLOOD').parentElement).toHaveTextContent('1 (50%)');
    expect(screen.getByText('Clear Sky').parentElement).toHaveTextContent('1 (50%)');
    expect(screen.getByText('Heavy Rain').parentElement).toHaveTextContent('1 (50%)');
  });

  it('applies, resets, and refreshes date filters', async () => {
    const interaction = userEvent.setup();
    render(<StatisticsDashboard language={Language.EN} isDarkMode={false} />);
    await screen.findByText('Total incidents');
    await interaction.type(screen.getByLabelText('From'), '2026-08-01');
    await interaction.type(screen.getByLabelText('To'), '2026-08-24');
    await interaction.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() => expect(fetchReportStatistics).toHaveBeenLastCalledWith(
      { from: '2026-08-01', to: '2026-08-24' }, expect.any(AbortSignal),
    ));
    await interaction.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(fetchReportStatistics).toHaveBeenLastCalledWith(
      { from: '', to: '' }, expect.any(AbortSignal),
    ));
    await interaction.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(fetchReportStatistics.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it('renders the localized empty state', async () => {
    fetchReportStatistics.mockResolvedValue({ total: 0, by_incident_type: [], daily: [], by_weather_condition: [] });
    render(<StatisticsDashboard language={Language.BS} isDarkMode />);
    expect(await screen.findByText('Nema prijavljenih incidenata za odabrani period.')).toBeInTheDocument();
  });

  it('offers retry after a failed request', async () => {
    fetchReportStatistics.mockRejectedValueOnce(new Error('Service offline')).mockResolvedValueOnce(statistics);
    const interaction = userEvent.setup();
    render(<StatisticsDashboard language={Language.EN} isDarkMode />);
    expect(await screen.findByText('Service offline')).toBeInTheDocument();
    await interaction.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Total incidents')).toBeInTheDocument();
  });
});
