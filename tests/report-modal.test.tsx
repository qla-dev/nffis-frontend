import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IncidentType, Language } from '../types';

const { analyzeIncidentUrgency } = vi.hoisted(() => ({ analyzeIncidentUrgency: vi.fn() }));
vi.mock('../services/geminiService', () => ({ analyzeIncidentUrgency }));

import { ReportModal } from '../components/Report/ReportModal';

const weather = {
  latitude: 43.85,
  longitude: 18.36,
  timezone: 'Europe/Sarajevo',
  current: {
    time: '2026-08-24T12:00', interval: 900, temperature_2m: 31.4,
    relative_humidity_2m: 42, apparent_temperature: 33.2, is_day: 1,
    precipitation: 0.2, rain: 0.2, showers: 0, snowfall: 0,
    weather_code: 0, cloud_cover: 15, pressure_msl: 1012,
    surface_pressure: 980, wind_speed_10m: 14, wind_direction_10m: 225,
    wind_gusts_10m: 25,
  },
  hourly: {
    time: ['2026-08-24T12:00', '2026-08-24T13:00'],
    temperature_2m: [31.4, 32], weather_code: [0, 1], precipitation_probability: [5, 10],
  },
  daily: {
    time: ['2026-08-24', '2026-08-25'], weather_code: [0, 2],
    temperature_2m_max: [34, 32], temperature_2m_min: [20, 19],
    precipitation_probability_max: [10, 25],
  },
} as any;

describe('ReportModal', () => {
  beforeEach(() => {
    analyzeIncidentUrgency.mockResolvedValue({ urgency: 'high', reason: 'Rapid spread' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(weather), { status: 200 })));
  });

  it('does not render without a selected map location', () => {
    const { container } = render(<ReportModal language={Language.EN} location={null} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('loads telemetry and submits a fire report with weather and AI urgency', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const interaction = userEvent.setup();
    render(<ReportModal
      language={Language.EN}
      location={{ lat: 43.85, lng: 18.36 }}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />);

    expect(screen.getByText('ACQUIRING TELEMETRY...')).toBeInTheDocument();
    expect((await screen.findAllByText('Clear Sky')).length).toBeGreaterThan(0);
    await interaction.type(
      screen.getByPlaceholderText(/Describe visibility/),
      'Large smoke column above pine forest',
    );
    await interaction.click(screen.getAllByRole('button', { name: /transmit report/i })[0]);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(analyzeIncidentUrgency).toHaveBeenCalledWith('Large smoke column above pine forest', IncidentType.FIRE);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      type: IncidentType.FIRE,
      incident_type: IncidentType.FIRE,
      latitude: 43.85,
      longitude: 18.36,
      timezone: 'Europe/Sarajevo',
      weather_condition: 'Clear Sky',
      temperature_c: 31.4,
      humidity_percent: 42,
      pressure_hpa: 1012,
      precipitation_mm: 0.2,
      wind_speed_kmh: 14,
      wind_direction_degrees: 225,
      wind_gust_kmh: 25,
      urgency: 'high',
    }));
  });

  it('shows weather and report submission failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    const { rerender } = render(<ReportModal language={Language.EN} location={{ lat: 1, lng: 2 }} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(await screen.findByText('Failed to retrieve environmental data.')).toBeInTheDocument();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(weather), { status: 200 })));
    const onSubmit = vi.fn().mockRejectedValue(new Error('Report rejected.'));
    rerender(<ReportModal language={Language.EN} location={{ lat: 3, lng: 4 }} onClose={vi.fn()} onSubmit={onSubmit} />);
    expect((await screen.findAllByText('Clear Sky')).length).toBeGreaterThan(0);
    const interaction = userEvent.setup();
    await interaction.type(screen.getByPlaceholderText(/Describe visibility/), 'Smoke');
    await interaction.click(screen.getAllByRole('button', { name: /transmit report/i })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Report rejected.');
  });
});
