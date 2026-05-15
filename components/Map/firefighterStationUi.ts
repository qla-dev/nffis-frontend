import type { FirefighterStationType } from '../../firefighterData';

export const FIREFIGHTER_STATION_STYLE: Record<
  FirefighterStationType,
  { label: string; color: string; glow: string }
> = {
  territorial: { label: 'T', color: '#f97316', glow: 'rgba(249,115,22,0.28)' },
  volunteer: { label: 'V', color: '#eab308', glow: 'rgba(234,179,8,0.28)' },
  industrial: { label: 'I', color: '#22d3ee', glow: 'rgba(34,211,238,0.28)' },
};
