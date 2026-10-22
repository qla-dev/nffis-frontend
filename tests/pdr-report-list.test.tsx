import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Language } from '../types';
import { PdrReportList } from '../components/Pdr/PdrReportList';
import * as service from '../services/pdrService';

vi.mock('../components/Pdr/PdrDashboardSummary', () => ({ PdrDashboardSummary: () => null }));

describe('PdrReportList', () => {
  it('loads subsequent API pages and resets to page one when a filter changes', async () => {
    const list = vi.spyOn(service, 'listPdrReports').mockImplementation(async filters => ({
      data: [{ id: filters.page === 2 ? 2 : 1, reference: `PDR-${filters.page}`, title: 'Real report', jurisdiction: 'fbih', status: 'draft', perimeter_area_ha: null, metadata: null, updated_at: '2026-10-22T10:00:00Z' }] as service.PdrReport[],
      total: 30, current_page: filters.page ?? 1, last_page: 2,
    }));
    render(<PdrReportList language={Language.EN} isDarkMode={false} canCreate={false} />);

    await screen.findByText('PDR-1');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('PDR-2');
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.anything());

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'All statuses' }), 'draft');
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, status: 'draft' }), expect.anything()));
  });
});
