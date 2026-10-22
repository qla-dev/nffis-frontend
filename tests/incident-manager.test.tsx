import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Language } from '../types';
import { IncidentManager } from '../components/Pdr/IncidentManager';
import * as service from '../services/incidentReportService';

const report = {
  id: 7, status: 'reported' as const, incident_type: 'fire', description: 'Smoke above Trebević', locality: 'Brus', region: null, jurisdiction: 'shared',
  fire_event_id: null, latitude: 43.83, longitude: 18.44, reported_at: '2026-08-02T11:40:00Z', created_at: '2026-08-02T11:40:00Z', updated_at: '2026-08-02T11:40:00Z',
  affected_area_ha: 12.5, injured: null, evacuated: null, user: { id: 1, name: 'Operator', email: 'o@test.local' },
};

describe('IncidentManager', () => {
  it('requests the next page instead of hiding older incidents', async () => {
    const list = vi.spyOn(service, 'listIncidentReports').mockImplementation(async ({ page } = {}) => ({
      data: [{ ...report, id: page === 2 ? 8 : 7 }], total: 26, current_page: page ?? 1, last_page: 2,
    }));
    render(<IncidentManager language={Language.EN} isDarkMode={false} canUpdate={false} />);

    await screen.findByText('#7 · fire');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('#8 · fire');
    expect(list).toHaveBeenLastCalledWith({ page: 2 });
  });

  it('edits structured incident attributes and sends numbers and nulls', async () => {
    vi.spyOn(service, 'listIncidentReports').mockResolvedValue({ data: [report], total: 1, current_page: 1, last_page: 1 });
    const update = vi.spyOn(service, 'updateIncidentReport').mockResolvedValue({ data: { ...report, status: 'contained' } });
    render(<IncidentManager language={Language.EN} isDarkMode={false} canUpdate />);

    await screen.findByText('#7 · fire');
    await userEvent.selectOptions(document.querySelector('select[name=status]')!, 'contained');
    await userEvent.type(document.querySelector('input[name=injured]')!, '2');
    await userEvent.type(document.querySelector('textarea[name=assistance_required]')!, 'Canadair');
    await userEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(7, expect.objectContaining({ status: 'contained', injured: 2, evacuated: null, affected_area_ha: 12.5, assistance_required: 'Canadair', dangerous_substances: null })));
  });

  it('is read-only without update permission', async () => {
    vi.spyOn(service, 'listIncidentReports').mockResolvedValue({ data: [report], total: 1, current_page: 1, last_page: 1 });
    render(<IncidentManager language={Language.BS} isDarkMode canUpdate={false} />);

    await screen.findByText('#7 · fire');
    expect(document.querySelector('select[name=status]')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Sačuvaj/ })).toBeNull();
  });
});
