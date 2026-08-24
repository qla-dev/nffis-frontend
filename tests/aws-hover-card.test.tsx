import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  disableClickPropagation,
  disableScrollPropagation,
  adjustAwsStation,
  fetchAwsStationHistory,
} = vi.hoisted(() => ({
  disableClickPropagation: vi.fn(),
  disableScrollPropagation: vi.fn(),
  adjustAwsStation: vi.fn(),
  fetchAwsStationHistory: vi.fn(),
}));
vi.mock('leaflet', () => ({
  default: { DomEvent: { disableClickPropagation, disableScrollPropagation } },
}));

vi.mock('../services/awsStationService', () => ({
  adjustAwsStation,
  fetchAwsStationHistory,
}));

import { AWSHoverCard } from '../components/Map/layers/AWS/AWSHoverCard';

const station = {
  city: 'Šeherdžik',
  type: 'precipitation',
  tempC: 16.1,
  humidityPct: 64,
  pressureHpa: 1009,
  precipMm: 1.2,
  windSpeedMs: 2.5,
  windDir: 'NW',
} as any;

describe('AWSHoverCard', () => {
  beforeEach(() => fetchAwsStationHistory.mockResolvedValue([]));

  it('shows station values and hides adjustment commands from forbidden roles', () => {
    render(<AWSHoverCard station={station} source="fbih" canAdjust={false} onAdjusted={vi.fn()} />);
    expect(screen.getByText('Šeherdžik')).toBeInTheDocument();
    expect(screen.getByText(/16.1/)).toBeInTheDocument();
    expect(screen.getByText(/64/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /adjust/i })).not.toBeInTheDocument();
    expect(disableClickPropagation).toHaveBeenCalled();
    expect(disableScrollPropagation).toHaveBeenCalled();
  });

  it('opens history inside the same card and renders changed fields', async () => {
    fetchAwsStationHistory.mockResolvedValue([{
      id: 1,
      previous_values: { tempC: 15 },
      values: { tempC: 16.1 },
      changed_fields: ['tempC'],
      origin: 'manual',
      recorded_at: '2026-08-24T12:00:00Z',
      changed_by: { id: 1, name: 'Admin', username: 'qla.dev' },
    }]);
    const interaction = userEvent.setup();
    render(<AWSHoverCard station={station} source="fbih" canAdjust onAdjusted={vi.fn()} />);

    await interaction.click(screen.getByRole('button', { name: /history/i }));
    expect(screen.getByText('Šeherdžik')).toBeInTheDocument();
    expect(await screen.findByText(/Admin · manual/)).toBeInTheDocument();
    expect(screen.getByText(/Temperature: 15 → 16.1/)).toBeInTheDocument();
    expect(fetchAwsStationHistory).toHaveBeenCalledWith('fbih', 'precipitation', 'Šeherdžik');
  });

  it('edits all visible fields and publishes the saved adjustment', async () => {
    const saved = {
      id: 9, source: 'fbih', station_key: 'Šeherdžik', station_type: 'precipitation',
      values: { tempC: 17.2, humidityPct: 66, pressureHpa: 1010, precipMm: 2, windSpeedMs: 3, windDir: 'SE' },
      adjusted_by: 1, adjusted_at: '2026-08-24T12:00:00Z',
    };
    adjustAwsStation.mockResolvedValue(saved);
    const onAdjusted = vi.fn();
    const interaction = userEvent.setup();
    render(<AWSHoverCard station={station} source="fbih" canAdjust onAdjusted={onAdjusted} />);

    await interaction.click(screen.getByRole('button', { name: /adjust/i }));
    const temperature = screen.getAllByRole('spinbutton')[0];
    await interaction.clear(temperature);
    await interaction.type(temperature, '17.2');
    const direction = screen.getByRole('textbox');
    await interaction.clear(direction);
    await interaction.type(direction, 'SE');
    await interaction.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(adjustAwsStation).toHaveBeenCalledWith(
      'fbih', 'precipitation', 'Šeherdžik',
      expect.objectContaining({ tempC: 17.2, humidityPct: 64, pressureHpa: 1009, precipMm: 1.2, windSpeedMs: 2.5, windDir: 'SE' }),
      expect.objectContaining({ tempC: 16.1, humidityPct: 64 }),
    ));
    expect(onAdjusted).toHaveBeenCalledWith(saved);
  });

  it('keeps the card open and exposes service errors', async () => {
    fetchAwsStationHistory.mockImplementationOnce(async () => {
      throw new Error('Station history is unavailable.');
    });
    const interaction = userEvent.setup();
    render(<AWSHoverCard station={station} source="fbih" canAdjust onAdjusted={vi.fn()} />);
    await interaction.click(screen.getByRole('button', { name: /history/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Station history is unavailable.');
    expect(screen.getByText('Šeherdžik')).toBeInTheDocument();
  });
});
