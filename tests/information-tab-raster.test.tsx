import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InformationTab } from '../components/Layers/EditLayerSidebar/InformationTab';
import type { DatasetLayer } from '../services/datasetService';

const raster = {
  id: 3341,
  table_schema: 'external',
  table_name: 'bih_esa_worldcover_2021',
  display_name: 'BiH ESA WorldCover 2021 land cover (100 m)',
  jurisdiction: 'fbih',
  category: 'forest',
  subcategory: 'land cover vegetation',
  geometry_family: 'raster',
  geometry_type: 'RASTER',
  layer_kind: 'raster',
  nearest_road_enabled: false,
  srid: 4326,
  feature_count: 1,
  bounds: { scope: 'BIH', resolution_m: 100 },
  style: {},
  filter_fields: [],
  visible_by_default: false,
} as DatasetLayer;

const rgb = (hex: string) => `rgb(${[1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16)).join(', ')})`;

describe('InformationTab raster metadata', () => {
  it('renders a raster with metadata-only bounds without crashing', () => {
    render(<InformationTab layer={raster} canEdit={false} canManageDataDelivery={false} />);

    expect(screen.getByText('Cloud Optimized GeoTIFF')).toBeInTheDocument();
    expect(screen.getByText('100 m')).toBeInTheDocument();
    expect(screen.getByText('No bounds available')).toBeInTheDocument();
    expect(screen.getByText('Land-cover legend')).toBeInTheDocument();
    expect(screen.getByText('Tree cover')).toBeInTheDocument();
    expect(screen.getByText('Permanent water bodies')).toBeInTheDocument();
  });

  it('renders numeric raster bounds when supplied', () => {
    render(<InformationTab layer={{ ...raster, bounds: { ...raster.bounds, minx: 17.35, miny: 42.6, maxx: 18.37, maxy: 43.88 } }} canEdit={false} canManageDataDelivery={false} />);

    expect(screen.getByText('17.350000')).toBeInTheDocument();
    expect(screen.getByText('43.880000')).toBeInTheDocument();
  });

  it.each([
    ['ndvi', -0.2, 0.9, 'Vegetation greenness (NDVI)', 'Less green', 'Greener', '#7f1d1d', '#166534'],
    ['ndii', -0.3, 0.6, 'Vegetation moisture (NDII)', 'Drier', 'Moister', '#9a3412', '#1e3a8a'],
    ['dryness', 0, 0.3, 'Relative vegetation dryness', 'Less dry', 'Drier', '#166534', '#b91c1c'],
  ] as const)('shows the %s colour scale and values', (scale, min, max, title, low, high, firstColor, lastColor) => {
    const layer: DatasetLayer = {
      ...raster,
      table_name: `bih_${scale}`,
      display_name: title,
      style: { raster_scale: scale, min, max },
    };
    render(<InformationTab layer={layer} canEdit={false} canManageDataDelivery={false} />);

    expect(screen.getByText('Colour legend')).toBeInTheDocument();
    const gradient = screen.getByRole('img', { name: `${title}: ${low} on the left, ${high} on the right` });
    expect(gradient.getAttribute('style')).toContain(rgb(firstColor));
    expect(gradient.getAttribute('style')).toContain(rgb(lastColor));
    expect(screen.getByText(min.toFixed(3))).toBeInTheDocument();
    expect(screen.getByText(max.toFixed(3))).toBeInTheDocument();
    if (scale === 'dryness') {
      expect(screen.getByText(/A value of 0\.3 means the observed NDII is 0\.3 index units below that wet reference/)).toBeInTheDocument();
      expect(screen.getByText(/It does not mean 30% moisture loss or 30% fire risk/)).toBeInTheDocument();
    } else {
      expect(screen.getByText(/not percent (vegetation cover|water content)/)).toBeInTheDocument();
    }
  });
});
