import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Language } from '../types';
import { DataSyncStatus } from '../components/Pdr/DataSyncStatus';
import * as service from '../services/pdrService';

describe('DataSyncStatus', () => {
  it('requests later synchronization run pages from the API', async () => {
    const list = vi.spyOn(service, 'listDataSyncRuns').mockImplementation(async (_source, page) => ({
      sources: [], current_page: page, last_page: 2, total: 51,
      data: [{ id: page, source: `source-${page}`, status: 'success', started_at: '2026-10-22T10:00:00Z', finished_at: null, duration_ms: 1000, records_fetched: 1, records_stored: 1, summary: null, error: null }],
    }));
    render(<DataSyncStatus language={Language.EN} isDarkMode={false} />);

    await screen.findByText('source-1');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('source-2');
    await waitFor(() => expect(list).toHaveBeenLastCalledWith('', 2, expect.anything()));
  });
});
