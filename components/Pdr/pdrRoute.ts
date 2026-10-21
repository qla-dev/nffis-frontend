export type PdrRoute =
  | { page: 'list' }
  | { page: 'report'; id: number | 'new'; step?: number }
  | { page: 'coefficients' }
  | { page: 'aoi' }
  | { page: 'sync' }
  | { page: 'history' };

/** Deep links: #/pdr, #/pdr/new, #/pdr/12, #/pdr/12/step/3, #/pdr/coefficients, #/pdr/aoi */
export function parsePdrHash(hash: string): PdrRoute | null {
  const path = hash.replace(/^#/, '');
  if (!path.startsWith('/pdr')) return null;
  const parts = path.split('/').filter(Boolean).slice(1);
  if (parts.length === 0) return { page: 'list' };
  if (parts[0] === 'coefficients') return { page: 'coefficients' };
  if (parts[0] === 'aoi') return { page: 'aoi' };
  if (parts[0] === 'sync') return { page: 'sync' };
  if (parts[0] === 'history') return { page: 'history' };
  if (parts[0] === 'new') return { page: 'report', id: 'new' };
  const id = Number(parts[0]);
  if (!Number.isInteger(id) || id <= 0) return { page: 'list' };
  const step = parts[1] === 'step' ? Number(parts[2]) : undefined;
  return { page: 'report', id, step: step && step >= 1 && step <= 6 ? step : undefined };
}

export function navigatePdr(path: string): void {
  window.location.hash = path;
}
