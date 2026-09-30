import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResponseReadinessPanel } from '../components/FireMonitoring/ResponseReadinessPanel';
import * as fireService from '../services/fireMonitoringService';

vi.mock('../services/fireMonitoringService', () => ({
  fetchFireResponsePlan: vi.fn(), createFireResponsePlan: vi.fn(), reviewFireResponsePlan: vi.fn(),
}));

const preview = {
  schema_version: 1, generated_at: '2026-09-25T08:00:00Z',
  decision_support_notice: 'Operator review is required.',
  access: { nearest_road: { distance_m: 750 }, nearest_water_source: { distance_m: 1200 } },
  ranked_stations: [{ id: 1, name: 'Station Centar', station_type: 'territorial', municipality: 'Centar', straight_line_distance_km: 4.2, travel_time_minutes: null, capacity: 12, capacity_source: 'reported', verification_status: 'reported' }],
  staging_candidates: [], exposure: null, warnings: ['Travel time unavailable.'], provenance: {},
};

describe('ResponseReadinessPanel', () => {
  beforeEach(() => {
    vi.mocked(fireService.fetchFireResponsePlan).mockResolvedValue({ data: null, preview });
    vi.mocked(fireService.createFireResponsePlan).mockResolvedValue({ data: { id: 9, fire_event_id: 4, version: 1, status: 'draft', plan: preview, created_at: '2026-09-25T08:00:00Z' } });
  });

  it('shows the server preview and creates a reviewable snapshot', async () => {
    const user = userEvent.setup();
    render(<ResponseReadinessPanel eventId={4} canManage />);
    expect(await screen.findByText('Station Centar')).toBeInTheDocument();
    expect(screen.getByText('750 m')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save new plan snapshot' }));
    await waitFor(() => expect(fireService.createFireResponsePlan).toHaveBeenCalledWith(4));
    expect(await screen.findByText(/Version 1/)).toBeInTheDocument();
  });
});
