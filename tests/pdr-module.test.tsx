import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Language } from '../types';
import { parsePdrHash } from '../components/Pdr/pdrRoute';
import { formatMetadataValue } from '../components/Pdr/PdrReportPage';
import { PdrResultsView } from '../components/Pdr/PdrResultsView';
import { drawingToGeometry } from '../components/Pdr/PerimeterMap';
import type { PdrResults } from '../services/pdrService';

const results: PdrResults = {
  perimeter: { area_ha: 288.94 },
  land_cover: {
    classes: [{ code: '312', label: { en: 'Coniferous forest', bs: 'Crnogorična šuma' }, group: 'forest', area_ha: 159.67, share: 0.553, features: 2 }],
    groups: [{ key: 'forest', label: { en: 'Commercial forest', bs: 'Privredne šume' }, area_ha: 160.87, share: 0.557 }],
    covered_ha: 288.94, unclassified_ha: 0, overlap_ha: 0,
  },
  roads: { inside_km: 13.13, buffer_km: 10.6, by_class: [{ class: 'track', inside_km: 3.6, buffer_km: 2.59, inside_segments: 4 }] },
  buildings: { inside_count: 26, buffer_count: 19, inside_footprint_m2: 2400, residential_inside: 20, residential_buffer: 12, by_type: [{ type: 'house', inside: 1, buffer: 0, inside_footprint_m2: 90 }] },
  protected_areas: { total_ha: 288.94, share: 1, sites: [{ name: 'Park prirode Trebević', designation: 'Park prirode', burnt_ha: 168.44, site_ha: 5100, share_of_site: 0.033 }] },
  population: { inside_estimate: 59, buffer_estimate: 36, persons_per_building: 2.97, method: 'Residential buildings × persons' },
  damage: {
    available: true, currency: 'EUR', total: 1362143, formula: 'Σ ...',
    coefficient_set: { id: 1, version: 1, name: 'v1', approved_at: null, approved_by: 'GIS Methodologist' },
    items: [{ category: 'buildings', key: 'house', label: { en: 'Building: house', bs: 'Objekt: house' }, quantity: 1, unit: 'building', rate: 25000, amount: 25000 }],
    by_category: { buildings: 25000 },
  },
  exposure_buffer_m: 500,
  warnings: [],
  data_sources: [{ dataset: 'land_cover', label: 'CORINE Land Cover 2018', source: 'Copernicus', table: 'pdr_clc_2018', scale: 'eu', features_used: 5, data_as_of: null }],
  duration_ms: 120,
  calculated_at: '2026-10-20T02:13:38Z',
};

describe('PDR deep links', () => {
  it('parses list, wizard, step, coefficient and AOI routes', () => {
    expect(parsePdrHash('#/pdr')).toEqual({ page: 'list' });
    expect(parsePdrHash('#/pdr/new')).toEqual({ page: 'report', id: 'new' });
    expect(parsePdrHash('#/pdr/12')).toEqual({ page: 'report', id: 12, step: undefined });
    expect(parsePdrHash('#/pdr/12/step/5')).toEqual({ page: 'report', id: 12, step: 5 });
    expect(parsePdrHash('#/pdr/12/step/9')).toEqual({ page: 'report', id: 12, step: undefined });
    expect(parsePdrHash('#/pdr/coefficients')).toEqual({ page: 'coefficients' });
    expect(parsePdrHash('#/pdr/aoi')).toEqual({ page: 'aoi' });
    expect(parsePdrHash('#/pdr/sync')).toEqual({ page: 'sync' });
    expect(parsePdrHash('#/map')).toBeNull();
  });
});

describe('PDR helpers', () => {
  it('closes drawn rings and needs three vertices', () => {
    expect(drawingToGeometry([[18.4, 43.8], [18.5, 43.8]])).toBeNull();
    expect(drawingToGeometry([[18.4, 43.8], [18.5, 43.8], [18.5, 43.9]])?.coordinates[0][0]).toEqual([[18.4, 43.8], [18.5, 43.8], [18.5, 43.9], [18.4, 43.8]]);
  });

  it('formats only ISO datetimes and keeps other text intact', () => {
    expect(formatMetadataValue('2026-08-02T11:40')).toBe('2026-08-02 11:40');
    expect(formatMetadataValue('Trebević – Brus')).toBe('Trebević – Brus');
  });
});

describe('PdrResultsView', () => {
  it('shows area, damage, exposure and sources in English', () => {
    render(<PdrResultsView results={results} language={Language.EN} isDarkMode={false} />);
    expect(screen.getByText('288.94 ha')).toBeInTheDocument();
    expect(screen.getAllByText('€1,362,143').length).toBeGreaterThan(0);
    expect(screen.getByText('Coniferous forest')).toBeInTheDocument();
    expect(screen.getByText('Park prirode Trebević')).toBeInTheDocument();
    expect(screen.getByText('CORINE Land Cover 2018')).toBeInTheDocument();
    const damageTable = screen.getByText('Building: house').closest('tr')!;
    expect(within(damageTable).getByText('1 buildings')).toBeInTheDocument();
  });

  it('renders Bosnian labels', () => {
    render(<PdrResultsView results={results} language={Language.BS} isDarkMode />);
    expect(screen.getByText('Crnogorična šuma')).toBeInTheDocument();
    expect(screen.getByText('Privredne šume')).toBeInTheDocument();
    expect(screen.getByText('Procijenjena ekonomska šteta', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('1 objekata')).toBeInTheDocument();
  });

  it('explains when no coefficient set is approved', () => {
    render(<PdrResultsView results={{ ...results, damage: { available: false, reason: 'No coefficient set has been approved.', formula: '' } }} language={Language.EN} isDarkMode={false} />);
    expect(screen.getByText(/No coefficient set has been approved/)).toBeInTheDocument();
  });
});
