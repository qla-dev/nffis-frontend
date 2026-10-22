import { MapLayer } from '../../types';

/**
 * Server-computed daily fire-danger indices that sit next to FWI. The class
 * limits mirror `fire_intelligence.weather.supplementary_indices.danger_classes`
 * in nffis-backend, so the legend and the stored `danger_class` agree.
 */
export type SupplementaryIndexType = 'ANGSTROM' | 'GFDI' | 'KBDI';
export type DailyIndexType = 'FWI' | SupplementaryIndexType;

export interface IndexClass { key: string; label: { en: string; bs: string }; min: number; max: number | null; color: string }

export interface SupplementaryIndexDefinition {
  type: SupplementaryIndexType;
  layer: MapLayer;
  label: { en: string; bs: string };
  method: string;
  unit: string;
  displayMin: number;
  displayMax: number;
  /** Lower values are more dangerous (Angström). */
  inverted: boolean;
  classes: IndexClass[];
}

export const SUPPLEMENTARY_INDICES: Record<SupplementaryIndexType, SupplementaryIndexDefinition> = {
  ANGSTROM: {
    type: 'ANGSTROM',
    layer: MapLayer.FWI_ANGSTROM,
    label: { en: 'Angström index', bs: 'Angströmov indeks' },
    method: 'Chandler et al. 1983 · 13:00',
    unit: '',
    displayMin: 0,
    displayMax: 6,
    inverted: true,
    classes: [
      { key: 'very_high', label: { en: 'Very likely', bs: 'Vrlo vjerovatan' }, min: 0, max: 2, color: '#b91c1c' },
      { key: 'high', label: { en: 'Favourable', bs: 'Povoljan' }, min: 2, max: 2.5, color: '#f97316' },
      { key: 'moderate', label: { en: 'Unfavourable', bs: 'Nepovoljan' }, min: 2.5, max: 4, color: '#eab308' },
      { key: 'low', label: { en: 'Unlikely', bs: 'Malo vjerovatan' }, min: 4, max: null, color: '#22c55e' },
    ],
  },
  GFDI: {
    type: 'GFDI',
    layer: MapLayer.FWI_GFI,
    label: { en: 'Grass fire index (GFDI)', bs: 'Indeks požara trave (GFDI)' },
    method: 'McArthur Mk3 · Noble et al. 1980',
    unit: '',
    displayMin: 0,
    displayMax: 60,
    inverted: false,
    classes: [
      { key: 'low', label: { en: 'Low', bs: 'Nizak' }, min: 0, max: 5, color: '#22c55e' },
      { key: 'moderate', label: { en: 'Moderate', bs: 'Umjeren' }, min: 5, max: 12, color: '#eab308' },
      { key: 'high', label: { en: 'High', bs: 'Visok' }, min: 12, max: 25, color: '#f97316' },
      { key: 'very_high', label: { en: 'Very high', bs: 'Vrlo visok' }, min: 25, max: 50, color: '#dc2626' },
      { key: 'extreme', label: { en: 'Extreme', bs: 'Ekstreman' }, min: 50, max: null, color: '#7f1d1d' },
    ],
  },
  KBDI: {
    type: 'KBDI',
    layer: MapLayer.FWI_KBDI,
    label: { en: 'Keetch–Byram drought index', bs: 'Keetch–Byram indeks suše' },
    method: 'Keetch & Byram 1968 · mm',
    unit: 'mm',
    displayMin: 0,
    displayMax: 203.2,
    inverted: false,
    classes: [
      { key: 'low', label: { en: 'Moist soil', bs: 'Vlažno tlo' }, min: 0, max: 50, color: '#22c55e' },
      { key: 'moderate', label: { en: 'Litter drying', bs: 'Stelja se suši' }, min: 50, max: 100, color: '#eab308' },
      { key: 'high', label: { en: 'Active litter', bs: 'Aktivna stelja' }, min: 100, max: 150, color: '#f97316' },
      { key: 'extreme', label: { en: 'Severe drought', bs: 'Teška suša' }, min: 150, max: null, color: '#7f1d1d' },
    ],
  },
};

export const SUPPLEMENTARY_INDEX_TYPES = Object.keys(SUPPLEMENTARY_INDICES) as SupplementaryIndexType[];

export function supplementaryIndexForLayer(layer: MapLayer): SupplementaryIndexDefinition | null {
  return Object.values(SUPPLEMENTARY_INDICES).find(definition => definition.layer === layer) ?? null;
}

/** The daily index whose availability drives the shared date timeline. */
export function timelineIndexType(activeLayers: ReadonlySet<MapLayer>): DailyIndexType | null {
  if (activeLayers.has(MapLayer.FWI_BOSNIAN) || activeLayers.has(MapLayer.FIRE_INTELLIGENCE_FWI)) return 'FWI';
  return SUPPLEMENTARY_INDEX_TYPES.find(type => activeLayers.has(SUPPLEMENTARY_INDICES[type].layer)) ?? null;
}

export function classifyIndexValue(type: SupplementaryIndexType, value: number): IndexClass {
  const { classes } = SUPPLEMENTARY_INDICES[type];
  return classes.find(item => item.max === null || value < item.max) ?? classes[classes.length - 1];
}

/**
 * Colour anchors on [0, 1] across the display range. Each class colour starts
 * at its lower limit; Angström is inverted, so dangerous low values are red.
 */
export function indexColorStops(type: SupplementaryIndexType): Array<{ position: number; color: string }> {
  const { classes, displayMin, displayMax } = SUPPLEMENTARY_INDICES[type];
  const span = displayMax - displayMin;
  const position = (value: number) => Math.max(0, Math.min(1, (value - displayMin) / span));
  const stops = classes.map(item => ({ position: position(item.min), color: item.color }));
  return [...stops, { position: 1, color: classes[classes.length - 1].color }];
}

export function indexCssGradient(type: SupplementaryIndexType): string {
  return `linear-gradient(90deg, ${indexColorStops(type).map(stop => `${stop.color} ${(stop.position * 100).toFixed(1)}%`).join(', ')})`;
}

/** Class boundaries shown as legend ticks, as a fraction of the display range. */
export function indexTicks(type: SupplementaryIndexType): Array<{ value: number; position: number }> {
  const { classes, displayMin, displayMax } = SUPPLEMENTARY_INDICES[type];
  const values = [displayMin, ...classes.map(item => item.max).filter((max): max is number => max !== null), displayMax];
  return values.map(value => ({ value, position: (value - displayMin) / (displayMax - displayMin) }));
}
