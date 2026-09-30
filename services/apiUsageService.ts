import { ApiError, apiRequest } from './api';

export interface ApiUsageProvider {
  id: string; name: string; category: string; plan: string; active: boolean; configured: boolean;
  metric: string; unit: string; usage: number; limit: number | null; usage_percent: number | null;
  cycle: 'daily' | 'monthly'; period_started_at: string; resets_at: string;
  usage_source: 'nffis_meter' | 'provider_console_only'; dashboard_url: string; note: string;
}
export interface ApiUsageSummary { generated_at: string; providers: ApiUsageProvider[]; }

type UsageEvent = { provider: string; metric: string; quantity: number };
const pending = new Map<string, UsageEvent>();
let flushTimer: number | null = null;
let endpointUnavailable = false;
let retryDelayMs = 4_000;

export function fetchApiUsage(): Promise<ApiUsageSummary> {
  return apiRequest('/admin/api-usage');
}

export function recordApiUsage(provider: string, metric: string, quantity = 1): void {
  if (endpointUnavailable) return;
  const key = `${provider}:${metric}`;
  const current = pending.get(key);
  pending.set(key, { provider, metric, quantity: (current?.quantity ?? 0) + quantity });
  if (flushTimer === null) flushTimer = window.setTimeout(flushApiUsage, retryDelayMs);
}

function flushApiUsage(): void {
  flushTimer = null;
  if (!pending.size) return;
  const events = [...pending.values()];
  pending.clear();
  void apiRequest('/api-usage/events', { method: 'POST', body: JSON.stringify({ events }) })
    .then(() => { retryDelayMs = 4_000; })
    .catch((error: unknown) => {
      if (error instanceof ApiError && [404, 405].includes(error.status)) {
        endpointUnavailable = true;
        return;
      }
      retryDelayMs = Math.min(60_000, retryDelayMs * 2);
      events.forEach(event => {
        const key = `${event.provider}:${event.metric}`;
        const current = pending.get(key);
        pending.set(key, { ...event, quantity: event.quantity + (current?.quantity ?? 0) });
      });
      if (flushTimer === null) flushTimer = window.setTimeout(flushApiUsage, retryDelayMs);
    });
}

function externalProvider(url: string): Pick<UsageEvent, 'provider' | 'metric'> | null {
  try {
    const host = new URL(url, window.location.href).hostname.toLowerCase();
    if (host === 'api.open-meteo.com' || host === 'archive-api.open-meteo.com') return { provider: 'open_meteo', metric: 'requests' };
    if (host === 'maps-api.meteoblue.com') return { provider: 'meteoblue', metric: 'requests' };
  } catch { /* Invalid URLs are handled by the original fetch implementation. */ }
  return null;
}

/** Counts browser-side external API calls without changing their request/response behavior. */
export function installExternalApiUsageTracker(): () => void {
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    const provider = externalProvider(url);
    const response = await original(input, init);
    if (provider) recordApiUsage(provider.provider, provider.metric);
    return response;
  };
  return () => { window.fetch = original; if (flushTimer !== null) { window.clearTimeout(flushTimer); flushApiUsage(); } };
}
