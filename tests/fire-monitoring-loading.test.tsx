import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useFireMonitoringData } from '../components/FireMonitoring/useFireMonitoringData';

const requests = vi.hoisted(() => ({
  fetchFireStatistics: vi.fn(),
  fetchFires: vi.fn(),
  fetchFireHealth: vi.fn(),
  fetchFireNotifications: vi.fn(),
  fetchFireIncidentReports: vi.fn(),
}));

vi.mock('../services/fireMonitoringService', () => ({
  ...requests,
  FIRE_REFRESH_MS: 60000,
}));

test('shows loading until the first fire monitoring request succeeds', async () => {
  let finishFirstRequest!: (value: unknown) => void;
  requests.fetchFireStatistics.mockReturnValueOnce(new Promise(resolve => { finishFirstRequest = resolve; }));
  requests.fetchFires.mockResolvedValue({ data: [], meta: {} });
  requests.fetchFireHealth.mockResolvedValue({ sources: [] });
  requests.fetchFireNotifications.mockResolvedValue({ data: [], unread_count: 0 });
  requests.fetchFireIncidentReports.mockResolvedValue({ data: [] });

  const { result } = renderHook(() => useFireMonitoringData());
  expect(result.current.loading).toBe(true);
  expect(result.current.error).toBe('');

  await act(async () => { finishFirstRequest({ active_events: 0 }); });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.stats).toEqual({ active_events: 0 });
  expect(result.current.error).toBe('');
});

test('shows unavailable only after the first request fails', async () => {
  let failRequest!: (reason: Error) => void;
  requests.fetchFireStatistics.mockReturnValueOnce(new Promise((_, reject) => { failRequest = reject; }));
  requests.fetchFires.mockResolvedValue({ data: [], meta: {} });
  requests.fetchFireHealth.mockResolvedValue({ sources: [] });
  requests.fetchFireNotifications.mockResolvedValue({ data: [], unread_count: 0 });
  requests.fetchFireIncidentReports.mockResolvedValue({ data: [] });

  const { result } = renderHook(() => useFireMonitoringData());
  expect(result.current.loading).toBe(true);
  expect(result.current.error).toBe('');

  await act(async () => { failRequest(new Error('Network failure')); });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe('Network failure');
});

test('an aborted request does not end loading while its replacement is pending', async () => {
  let finishFirst!: (value: unknown) => void;
  let finishSecond!: (value: unknown) => void;
  requests.fetchFireStatistics
    .mockReturnValueOnce(new Promise(resolve => { finishFirst = resolve; }))
    .mockReturnValueOnce(new Promise(resolve => { finishSecond = resolve; }));
  requests.fetchFires.mockResolvedValue({ data: [], meta: {} });
  requests.fetchFireHealth.mockResolvedValue({ sources: [] });
  requests.fetchFireNotifications.mockResolvedValue({ data: [], unread_count: 0 });
  requests.fetchFireIncidentReports.mockResolvedValue({ data: [] });

  const { result } = renderHook(() => useFireMonitoringData());
  await act(async () => { void result.current.reload(); });
  await act(async () => { finishFirst({ active_events: 1 }); });
  expect(result.current.loading).toBe(true);
  expect(result.current.stats).toBeNull();
  expect(result.current.error).toBe('');

  await act(async () => { finishSecond({ active_events: 2 }); });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.stats).toEqual({ active_events: 2 });
});
